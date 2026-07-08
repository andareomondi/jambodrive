"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BookingForm,
  BookingFormData,
} from "@/components/booking/booking-form";
import { EmptyState } from "@/components/common/empty-state";
import { toast } from "sonner";
import {
  CheckCircle,
  Loader2,
  XCircle,
  Smartphone,
  Wifi,
  Copy,
  Phone,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { Car } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PaymentState =
  | "idle"
  | "processing"
  | "waiting_for_pin"
  | "success"
  | "failed";

interface PaymentResult {
  receiptNumber?: string;
  amount?: number;
}

// Updated to the official Cosmara support number
const MPESA_SUPPORT_NUMBER = "254758500943";

export default function BookingClientPage({ car }: { car: Car | null }) {
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentResult, setPaymentResult] = useState<PaymentResult>({});

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  const calcDays = (data: BookingFormData) => {
    const ms =
      new Date(data.returnDate).getTime() - new Date(data.pickupDate).getTime();
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const handleBooking = async (data: BookingFormData) => {
    const today = new Date();
    const pickup = new Date(data.pickupDate);
    const returnD = new Date(data.returnDate);
    if (pickup < today) {
      throw new Error("Pickup date cannot be in the past.");
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to make a booking.");
        return;
      }

      setBookingData(data);
      setPaymentState("processing");
      setPaymentMessage("");

      const days = calcDays(data);
      const total = days * car!.price;

      if (returnD <= pickup) {
        throw new Error("Return date must be after pickup date.");
      }
      if (!car!.available) {
        throw new Error("Sorry, this car is no longer available.");
      }

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          car_id: car!.id,
          profile_id: user.id,
          pickup_date: new Date(data.pickupDate).toISOString(),
          return_date: new Date(data.returnDate).toISOString(),
          pickup_location: data.pickupLocation,
          return_location: data.returnLocation,
          total_price: total,
          status: "pending",
          days,
        })
        .select()
        .single();

      if (bookingError || !newBooking) {
        throw new Error(bookingError?.message ?? "Failed to create booking.");
      }

      const channel = supabase
        .channel(`booking_status_${newBooking.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bookings",
            filter: `id=eq.${newBooking.id}`,
          },
          async (payload) => {
            const updated = payload.new as any;
            if (updated.status === "confirmed") {
              try {
                // Mark the vehicle as unavailable/booked in the database
                await supabase
                  .from("cars")
                  .update({ available: false })
                  .eq("id", car!.id);
              } catch (carError) {
                console.error("Failed to update car availability:", carError);
              }

              setPaymentResult({
                receiptNumber: updated.mpesa_receipt_number,
                amount: updated.paid_amount,
              });
              setPaymentState("success");
              toast.success("Payment confirmed! Your car is booked.");
              channel.unsubscribe();
            } else if (updated.status === "failed") {
              setPaymentState("failed");
              setPaymentMessage(
                updated.payment_failure_reason ??
                  "Payment was cancelled or failed.",
              );
              channel.unsubscribe();
            }
          },
        )
        .subscribe();

      channelRef.current = channel;

      const stkResponse = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.phone,
          amount: total,
          bookingId: newBooking.id,
        }),
      });

      const stkData = await stkResponse.json();

      if (!stkResponse.ok || !stkData.success) {
        channel.unsubscribe();
        await supabase
          .from("bookings")
          .update({ status: "failed", payment_failure_reason: stkData.error })
          .eq("id", newBooking.id);
        throw new Error(stkData.error ?? "M-Pesa request failed.");
      }

      setPaymentState("waiting_for_pin");

      setTimeout(() => {
        setPaymentState((current) => {
          if (current === "waiting_for_pin") {
            channel.unsubscribe();
            setPaymentMessage(
              "The payment is taking too long. Check your M-Pesa messages — if deducted, contact support.",
            );
            return "failed";
          }
          return current;
        });
      }, 90_000);
    } catch (err: unknown) {
      console.error("[BookingPage] handleBooking error:", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setPaymentState("failed");
      setPaymentMessage(message);
    }
  };
  if (!car || !car.available) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="Unavailable"
          description="Car not found or unavailable."
          action={{ label: "Back to Fleet", href: "/cars" }}
        />
      </div>
    );
  }

  const totalAmount = bookingData ? calcDays(bookingData) * car.price : 0;

  if (paymentState === "success" && bookingData) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground text-sm">
              Your {car.name} has been reserved. A confirmation will be sent to
              your phone.
            </p>
          </div>

          {paymentResult.receiptNumber && (
            <div className="bg-card border border-border rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                M-Pesa Receipt
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-foreground">
                  {paymentResult.receiptNumber}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentResult.receiptNumber!);
                    toast.success("Receipt number copied!");
                  }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Amount paid:{" "}
                <span className="text-foreground font-medium">
                  Ksh {(paymentResult.amount ?? totalAmount).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-center hover:opacity-90 transition-opacity"
            >
              View My Bookings
            </Link>
            <Link
              href="/cars"
              className="w-full px-6 py-3 bg-muted text-foreground rounded-xl font-medium text-center hover:bg-muted/80 transition-colors"
            >
              Browse More Cars
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const PaymentModal = () => {
    if (paymentState === "idle") return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
          {paymentState === "processing" && (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  Connecting to M-Pesa
                </h2>
                <p className="text-sm text-muted-foreground">
                  Securing your booking and reaching Safaricom...
                </p>
              </div>
            </div>
          )}

          {paymentState === "waiting_for_pin" && (
            <div className="p-8 flex flex-col items-center text-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative w-20 h-20 bg-card border border-border rounded-full flex items-center justify-center shadow-inner">
                  <Smartphone className="w-9 h-9 text-primary" />
                  <Wifi className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Check Your Phone
                </h2>
                <p className="text-sm text-muted-foreground">
                  An M-Pesa prompt has been sent to{" "}
                  <span className="font-medium text-foreground">
                    {bookingData?.phone}
                  </span>
                  . Enter your PIN to pay{" "}
                  <span className="font-bold text-foreground">
                    Ksh {totalAmount.toLocaleString()}
                  </span>
                  .
                </p>
              </div>

              <div className="bg-muted rounded-xl px-4 py-3 w-full flex items-center justify-center gap-3">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Waiting for your confirmation...
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Prompt not received?{" "}
                <a
                  href={`tel:+${MPESA_SUPPORT_NUMBER}`}
                  className="text-accent hover:underline inline-flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> Call support
                </a>
              </p>
            </div>
          )}

          {paymentState === "failed" && (
            <div className="p-8 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Payment Failed
                </h2>
                <p className="text-sm text-muted-foreground">
                  {paymentMessage ||
                    "You cancelled the prompt or the request timed out."}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    setPaymentState("idle");
                    setPaymentMessage("");
                  }}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
                <a
                  href={`tel:+${MPESA_SUPPORT_NUMBER}`}
                  className="w-full px-6 py-3 bg-muted text-foreground rounded-xl font-medium text-center hover:bg-muted/80 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Contact Support
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isProcessingPayment =
    paymentState !== "idle" && paymentState !== "failed";

  return (
    <>
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <PaymentModal />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <BookingForm
              carName={car.name}
              onSubmit={handleBooking}
              isLoading={isProcessingPayment}
            />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-24 shadow-sm">
              <h3 className="font-semibold text-foreground">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Vehicle</span>
                  <span className="text-foreground font-medium">
                    {car.name}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Daily rate</span>
                  <span className="text-foreground font-medium">
                    Ksh {car.price.toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-4">
                Payment is processed securely via M-Pesa. You will receive an
                STK push prompt on your registered Safaricom number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
