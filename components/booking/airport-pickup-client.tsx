"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Plane,
  Smartphone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createAirportPickupRequest } from "@/lib/actions/airport-pickups";
import { MpesaPaymentDialog } from "@/components/booking/mpesa-payment-dialog";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AirportPickup, AirportPickupRate } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useMpesaStatusPolling } from "@/hooks/use-mpesa-status-polling";

const SUPPORT_NUMBER = "254758500943";

interface AirportPickupClientProps {
  rates: AirportPickupRate[];
}

export function AirportPickupClient({ rates }: AirportPickupClientProps) {
  const [airportCode, setAirportCode] = useState(rates[0]?.airport_code ?? "");
  const airportRoutes = useMemo(
    () => rates.filter((rate) => rate.airport_code === airportCode),
    [airportCode, rates],
  );
  const [rateId, setRateId] = useState(airportRoutes[0]?.id ?? "");
  const [arrivalAt, setArrivalAt] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [passengerCount, setPassengerCount] = useState("1");
  const [luggageCount, setLuggageCount] = useState("0");
  const [contactPhone, setContactPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [pickup, setPickup] = useState<AirportPickup | null>(null);
  const [paymentState, setPaymentState] = useState<
    "idle" | "processing" | "waiting" | "paid" | "failed"
  >("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const paymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();
  const selectedRate = rates.find((rate) => rate.id === rateId);

  useMpesaStatusPolling(
    "airport",
    pickup?.id,
    paymentState === "waiting",
    (result) => {
      if (result.status === "paid") {
        setPaymentState("paid");
        setPaymentMessage("Payment confirmed. Your request has been sent to our team.");
        toast.success("Payment confirmed. Airport pickup requested.");
        channelRef.current?.unsubscribe();
      } else if (result.status === "failed") {
        setPaymentState("failed");
        setPaymentMessage(result.reason ?? "M-Pesa could not complete the payment.");
        channelRef.current?.unsubscribe();
      }
    },
  );

  useEffect(
    () => () => {
      channelRef.current?.unsubscribe();
      if (paymentTimeoutRef.current) clearTimeout(paymentTimeoutRef.current);
    },
    [],
  );

  const handleAirportChange = (nextAirport: string) => {
    setAirportCode(nextAirport);
    setRateId(rates.find((rate) => rate.airport_code === nextAirport)?.id ?? "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRate) {
      toast.error("Choose an available airport route.");
      return;
    }

    setPaymentState("processing");
    setPaymentMessage("");
    setPaymentDialogOpen(true);
    try {
      const request = await createAirportPickupRequest({
        rateId: selectedRate.id,
        arrivalAt: new Date(arrivalAt).toISOString(),
        flightNumber,
        passengerCount: Number(passengerCount),
        luggageCount: Number(luggageCount),
        contactPhone,
        customerNotes,
      });
      setPickup(request);

      const channel = supabase
        .channel(`airport_pickup_${request.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "airport_pickups",
            filter: `id=eq.${request.id}`,
          },
          (payload) => {
            const updated = payload.new as AirportPickup;
            setPickup(updated);
            if (updated.payment_status === "paid") {
              setPaymentState("paid");
              setPaymentMessage("Payment confirmed. Your request has been sent to our team.");
              if (paymentTimeoutRef.current) {
                clearTimeout(paymentTimeoutRef.current);
              }
              toast.success("Payment confirmed. Airport pickup requested.");
              channel.unsubscribe();
            } else if (updated.payment_status === "failed") {
              setPaymentState("failed");
              setPaymentMessage(
                updated.payment_failure_reason ?? "The M-Pesa payment failed.",
              );
              channel.unsubscribe();
            }
          },
        );
      channelRef.current = channel;
      channel.subscribe();

      setPaymentState("waiting");
      setPaymentMessage("Check your phone and enter your M-Pesa PIN.");
      const response = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          airportPickupId: request.id,
          phone: contactPhone,
        }),
      });
      const result = await response.json();

      if ((!response.ok || !result.success) && !result.paymentMayBePending) {
        channel.unsubscribe();
        throw new Error(result.error ?? "Could not start the M-Pesa payment.");
      }

      if (result.paymentMayBePending) {
        setPaymentMessage(
          result.error ??
            "The payment request may have reached M-Pesa. Do not retry if you approved it; we are checking its status.",
        );
      }

      paymentTimeoutRef.current = setTimeout(() => {
        setPaymentMessage(
          "Payment confirmation is taking longer than expected. Check your M-Pesa messages; do not retry if you approved the prompt. Contact support if it remains pending.",
        );
      }, 90_000);
    } catch (error: unknown) {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      const message =
        error instanceof Error ? error.message : "Could not submit the request.";
      setPaymentState("failed");
      setPaymentMessage(message);
      toast.error(message);
    }
  };

  if (rates.length === 0) {
    return (
      <Card className="mx-auto max-w-3xl p-8 text-center">
        <Plane className="mx-auto mb-4 h-10 w-10 text-accent" />
        <h1 className="font-display text-3xl font-semibold">Airport pickups</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Airport routes and fares are being prepared. Please check back soon.
        </p>
        <Button asChild className="mt-6">
          <Link href="/cars">Browse our fleet</Link>
        </Button>
      </Card>
    );
  }

  return (
    <>
    <MpesaPaymentDialog
      open={paymentDialogOpen}
      state={
        paymentState === "processing" || paymentState === "waiting"
          ? paymentState
          : paymentState === "paid"
            ? "success"
            : "failed"
      }
      phone={contactPhone}
      amount={selectedRate?.fare_amount}
      description="airport pickup"
      message={paymentMessage}
      onClose={() => setPaymentDialogOpen(false)}
    />
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.72fr]">
      <div>
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
          <Plane className="h-4 w-4" /> Airport transfer
        </p>
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Arrive. We’ll take it from here.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          Choose your airport and destination, share your arrival details, then
          pay the configured fare securely with M-Pesa. Our team receives the
          request as soon as payment is confirmed.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          You’ll need to be signed in to request a pickup.{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-accent underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <Card className="mt-7 p-5 sm:p-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-busy={paymentState === "processing" || paymentState === "waiting"}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="airport">Airport</Label>
                <select
                  id="airport"
                  value={airportCode}
                  onChange={(event) => handleAirportChange(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  {[...new Map(rates.map((rate) => [rate.airport_code, rate])).values()].map(
                    (rate) => (
                      <option key={rate.airport_code} value={rate.airport_code}>
                        {rate.airport_name} ({rate.airport_code})
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <select
                  id="destination"
                  value={rateId}
                  onChange={(event) => setRateId(event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  {airportRoutes.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.destination}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="arrivalAt">Arrival date and time</Label>
                <Input
                  id="arrivalAt"
                  type="datetime-local"
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
                    .toISOString()
                    .slice(0, 16)}
                  value={arrivalAt}
                  onChange={(event) => setArrivalAt(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flightNumber">Flight number</Label>
                <Input
                  id="flightNumber"
                  value={flightNumber}
                  onChange={(event) => setFlightNumber(event.target.value)}
                  placeholder="e.g. KQ 100"
                  maxLength={20}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="passengers">Passengers</Label>
                <Input
                  id="passengers"
                  type="number"
                  min={1}
                  max={30}
                  value={passengerCount}
                  onChange={(event) => setPassengerCount(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="luggage">Luggage pieces</Label>
                <Input
                  id="luggage"
                  type="number"
                  min={0}
                  max={50}
                  value={luggageCount}
                  onChange={(event) => setLuggageCount(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">M-Pesa / contact phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="07XX XXX XXX"
                autoComplete="tel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerNotes">Additional details (optional)</Label>
              <textarea
                id="customerNotes"
                value={customerNotes}
                onChange={(event) => setCustomerNotes(event.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Meeting point, child seats, or other requests"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={
                !selectedRate ||
                paymentState === "processing" ||
                paymentState === "waiting" ||
                paymentState === "paid"
              }
              aria-busy={paymentState === "processing" || paymentState === "waiting"}
            >
              {paymentState === "processing" || paymentState === "waiting" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Smartphone className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {paymentState === "processing"
                ? "Preparing secure payment…"
                : paymentState === "waiting"
                  ? "Waiting for M-Pesa"
                  : paymentState === "paid"
                    ? "Pickup requested"
                  : "Request pickup & pay"}
            </Button>
            {paymentState === "failed" && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPaymentState("idle");
                  setPickup(null);
                }}
              >
                Try again with a new request
              </Button>
            )}
          </form>
        </Card>
      </div>

      <aside className="lg:pt-12">
        <Card className="sticky top-24 overflow-hidden border-accent/20 p-6 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Your transfer
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold">
            {selectedRate?.airport_name ?? "Select an airport"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedRate?.destination ?? "Select a destination"}
          </p>
          <div className="my-5 border-t border-border" />
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm text-muted-foreground">Fare</span>
            <span className="text-2xl font-bold text-accent">
              {selectedRate
                ? `KSh ${selectedRate.fare_amount.toLocaleString()}`
                : "—"}
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            The fare is set by the airport route and confirmed by our server
            before the M-Pesa prompt is sent. Review the route and fare above
            before authorizing payment.
          </p>
          {paymentState !== "idle" && paymentMessage && (
            <div
              className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${
                paymentState === "paid"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                  : paymentState === "failed"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-accent/30 bg-accent/10 text-foreground"
              }`}
              role={paymentState === "failed" ? "alert" : "status"}
              aria-live={paymentState === "failed" ? "assertive" : "polite"}
            >
              {paymentState === "paid" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : paymentState === "failed" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{paymentMessage}</span>
            </div>
          )}
          {paymentState === "paid" && pickup?.mpesa_receipt_number && (
            <p className="mt-3 text-xs text-muted-foreground">
              M-Pesa receipt: <strong>{pickup.mpesa_receipt_number}</strong>
            </p>
          )}
          {paymentState === "paid" && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Request reference: {pickup?.id.slice(0, 8).toUpperCase()} ·
                Status: requested
              </p>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href="/dashboard">Track this pickup</Link>
              </Button>
            </div>
          )}
          {paymentState === "failed" && (
            <p className="mt-3 text-xs text-muted-foreground">
              If money was deducted, check your M-Pesa messages before retrying.
              Need help?{" "}
              <a
                href={`tel:+${SUPPORT_NUMBER}`}
                className="font-semibold text-accent underline-offset-4 hover:underline"
              >
                Call support
              </a>
              .
            </p>
          )}
        </Card>
      </aside>
    </div>
    </>
  );
}
