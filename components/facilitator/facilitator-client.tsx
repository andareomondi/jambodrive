"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  processCarReturn,
  initiateFacilitatorCharge,
} from "@/lib/actions/facilitator";
import { toast } from "sonner";
import {
  Loader2, ClipboardCheck, AlertTriangle, Car as CarIcon,
  Settings, Smartphone, Wifi, XCircle, CheckCircle, X,
} from "lucide-react";
import type { Booking } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentState = "idle" | "processing" | "waiting_for_pin" | "success" | "failed";

// Extend Booking.cars to include price (fetched in page.tsx with cars(name, image, price))
type BookingWithCarPrice = Booking & {
  cars: { name: string; image: string | null; price: number } | null;
};

interface FacilitatorClientProps {
  initialBookings: BookingWithCarPrice[];
}

// ── Checklist config ──────────────────────────────────────────────────────────

const CHECKLIST_FIELDS = [
  {
    label: "Tire Infrastructure",
    key: "tire" as const,
    options: [
      { value: "Good",    label: "Good (Treads match metrics)"      },
      { value: "Worn",    label: "Worn (Flagged for replacement)"   },
      { value: "Damaged", label: "Damaged (Puncture/flat)"          },
    ],
  },
  {
    label: "Exterior Panels",
    key: "exterior" as const,
    options: [
      { value: "Good",                label: "Good (Zero new body marks)"  },
      { value: "Minor Scratches",     label: "Minor Scratches"             },
      { value: "Dents / Major Damage",label: "Dents / Structural Damage"   },
    ],
  },
  {
    label: "Cabin Interior",
    key: "interior" as const,
    options: [
      { value: "Clean",       label: "Clean (Match on entry)"        },
      { value: "Minor Dirt",  label: "Minor Dirt (Standard wash)"    },
      { value: "Damaged",     label: "Upholstery stains / tearing"   },
    ],
  },
  {
    label: "Fuel Level",
    key: "fuel" as const,
    options: [
      { value: "Full",  label: "Full (Match on handover)" },
      { value: "1/2",   label: "Half Tank"                },
      { value: "Empty", label: "Empty (Refuel required)"  },
    ],
  },
] as const;

type ChecklistKey = typeof CHECKLIST_FIELDS[number]["key"];
type ChecklistState = Record<ChecklistKey, string>;

const DEFAULT_CHECKLIST: ChecklistState = {
  tire: "Good", exterior: "Good", interior: "Clean", fuel: "Full",
};

// ── Payment overlay ───────────────────────────────────────────────────────────

function PaymentOverlay({
  state, message, phone, amount,
  onRetry,
}: {
  state: PaymentState;
  message: string;
  phone: string | null | undefined;
  amount: number;
  onRetry: () => void;
}) {
  if (state === "idle") return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {state === "processing" && (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                {amount > 0 ? "Connecting to M-Pesa" : "Processing Return"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {amount > 0
                  ? "Securing connection with Safaricom..."
                  : "Completing vehicle return..."}
              </p>
            </div>
          </div>
        )}

        {state === "waiting_for_pin" && (
          <div className="p-8 flex flex-col items-center text-center gap-5 relative overflow-hidden">
            {/* Accent pulse bar at top */}
            <div className="absolute top-0 left-0 w-full h-1 bg-accent animate-pulse" />
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center shadow-inner">
                <Smartphone className="w-9 h-9 text-accent" />
                <Wifi className="w-4 h-4 text-accent absolute top-2 right-2 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Check Customer's Phone
              </h2>
              <p className="text-sm text-muted-foreground">
                An M-Pesa prompt has been sent to{" "}
                <span className="font-medium text-foreground">{phone}</span>{" "}
                for{" "}
                <strong className="text-foreground">
                  Ksh {amount.toLocaleString()}
                </strong>.
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 w-full flex items-center justify-center gap-3">
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              <span className="text-sm font-medium text-muted-foreground">
                Waiting for confirmation...
              </span>
            </div>
          </div>
        )}

        {state === "success" && (
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
              <CheckCircle className="w-12 h-12 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Return Complete</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Car returned and marked available in the fleet.
              </p>
            </div>
          </div>
        )}

        {state === "failed" && (
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Payment Failed</h2>
              <p className="text-sm text-muted-foreground">
                {message || "The payment was cancelled or timed out."}
              </p>
            </div>
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FacilitatorClient({ initialBookings }: FacilitatorClientProps) {
  const [bookings, setBookings]             = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCarPrice | null>(null);
  const [paymentState, setPaymentState]     = useState<PaymentState>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [checklist, setChecklist]           = useState<ChecklistState>(DEFAULT_CHECKLIST);
  const [customNotes, setCustomNotes]       = useState("");
  const [damageFee, setDamageFee]           = useState(0);

  const channelRef       = useRef<RealtimeChannel | null>(null);
  const compiledNotesRef = useRef("");
  const totalFeesRef     = useRef(0);

  // ── Late fee calculation ──────────────────────────────────────────────────

  const lateFeeDetails = useMemo(() => {
    if (!selectedBooking) return { daysLate: 0, fee: 0 };
    const returnDate = new Date(selectedBooking.return_date);
    const today = new Date();
    if (today > returnDate) {
      const daysLate = Math.ceil(
        (today.getTime() - returnDate.getTime()) / 86_400_000,
      );
      // cars(price) is now included in the query
      const dailyRate = selectedBooking.cars?.price ?? 0;
      return { daysLate, fee: Math.round(daysLate * dailyRate * 1.1) };
    }
    return { daysLate: 0, fee: 0 };
  }, [selectedBooking]);

  const totalAdditionalFees = damageFee + lateFeeDetails.fee;

  // ── Close + reset ─────────────────────────────────────────────────────────

  const closeModal = useCallback(() => {
    if (paymentState === "processing" || paymentState === "waiting_for_pin") return;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setSelectedBooking(null);
    setPaymentState("idle");
    setPaymentMessage("");
    setChecklist(DEFAULT_CHECKLIST);
    setCustomNotes("");
    setDamageFee(0);
    compiledNotesRef.current = "";
    totalFeesRef.current = 0;
  }, [paymentState]);

  // ── Build inspection note ────────────────────────────────────────────────

  const buildNotes = () => `
[INSPECTION REPORT]
Tires: ${checklist.tire} | Exterior: ${checklist.exterior}
Interior: ${checklist.interior} | Fuel: ${checklist.fuel}
---
[FEES]
Damage/Missing: Ksh ${damageFee}
Late Fee (${lateFeeDetails.daysLate} days): Ksh ${lateFeeDetails.fee}
Total Charged: Ksh ${totalAdditionalFees}
---
[NOTES]
${customNotes || "None."}
  `.trim();

  // ── Return flow ───────────────────────────────────────────────────────────

  const handleProcessReturn = async () => {
    if (!selectedBooking) return;

    const compiledNotes = buildNotes();
    compiledNotesRef.current = compiledNotes;
    totalFeesRef.current = totalAdditionalFees;

    // No fees — skip STK, complete return directly
    if (totalAdditionalFees <= 0) {
      setPaymentState("processing");
      try {
        const res = await processCarReturn(
          selectedBooking.id,
          selectedBooking.car_id!,
          compiledNotes,
          0,
        );
        if (!res.success) throw new Error(res.error);
        setPaymentState("success");
        setTimeout(() => {
          setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
          closeModal();
        }, 2500);
      } catch (err: unknown) {
        setPaymentState("failed");
        setPaymentMessage(err instanceof Error ? err.message : "Failed to complete return.");
      }
      return;
    }

    // Has fees — STK push flow
    const phone = selectedBooking.profiles?.phone;
    if (!phone) {
      toast.error("Customer phone number is missing.");
      return;
    }

    setPaymentState("processing");
    setPaymentMessage("");

    try {
      // Set up Realtime listener BEFORE triggering STK to avoid missing the callback
      const supabase = createClient();
      const channel = supabase
        .channel(`facilitator_fee_${selectedBooking.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bookings",
            filter: `id=eq.${selectedBooking.id}`,
          },
          async (payload) => {
            const updated = payload.new as {
              additional_fee_status?: string;
              additional_fee_reason?: string;
            };

            if (updated.additional_fee_status === "confirmed") {
              channel.unsubscribe();
              channelRef.current = null;
              try {
                await processCarReturn(
                  selectedBooking.id,
                  selectedBooking.car_id!,
                  compiledNotesRef.current,
                  totalFeesRef.current,
                );
                setPaymentState("success");
                setTimeout(() => {
                  setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
                  closeModal();
                }, 2500);
              } catch (err: unknown) {
                setPaymentState("failed");
                setPaymentMessage(
                  err instanceof Error
                    ? err.message
                    : "Payment received but failed to complete return.",
                );
              }
            } else if (updated.additional_fee_status === "failed") {
              channel.unsubscribe();
              channelRef.current = null;
              setPaymentState("failed");
              setPaymentMessage(
                updated.additional_fee_reason || "Payment was cancelled or failed.",
              );
            }
          },
        )
        .subscribe();

      channelRef.current = channel;

      const stkResponse = await initiateFacilitatorCharge(
        selectedBooking.id,
        phone,
        totalAdditionalFees,
        selectedBooking.id.slice(0, 12),
      );

      if (!stkResponse.success) {
        channel.unsubscribe();
        channelRef.current = null;
        throw new Error(stkResponse.error || "STK push failed.");
      }

      setPaymentState("waiting_for_pin");

      // 90s safety timeout — if Safaricom doesn't call back
      setTimeout(() => {
        setPaymentState((current) => {
          if (current === "waiting_for_pin") {
            channelRef.current?.unsubscribe();
            channelRef.current = null;
            setPaymentMessage(
              "No response after 90 seconds. If amount was deducted, contact support.",
            );
            return "failed";
          }
          return current;
        });
      }, 90_000);
    } catch (err: unknown) {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      setPaymentState("failed");
      setPaymentMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facilitator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Perform visual inspections and handle return balances.
          </p>
        </div>

        {/* Booking list */}
        <div className="grid gap-4">
          {bookings.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-border">
              <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium text-foreground">No Active Trips</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All vehicles are back in the garage lot.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-card p-5 sm:p-6 rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-foreground">
                    {booking.cars?.name ?? "Vehicle"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Customer:{" "}
                    <span className="font-medium text-foreground">
                      {booking.profiles?.full_name ?? "Unknown"}
                    </span>{" "}
                    {booking.profiles?.phone && `(${booking.profiles.phone})`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due:{" "}
                    {new Date(booking.return_date).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {new Date() > new Date(booking.return_date) && (
                      <span className="ml-2 text-destructive font-semibold">
                        — OVERDUE
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedBooking(booking)}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto rounded-xl shrink-0"
                >
                  Inspect & Return
                </Button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Payment overlay — renders above inspection modal */}
      <PaymentOverlay
        state={paymentState}
        message={paymentMessage}
        phone={selectedBooking?.profiles?.phone}
        amount={totalFeesRef.current}
        onRetry={() => setPaymentState("idle")}
      />

      {/* Inspection modal */}
      {selectedBooking && paymentState === "idle" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">

            {/* Modal header */}
            <div className="flex justify-between items-start p-6 border-b border-border sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-xl font-bold text-foreground">Return Inspection</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedBooking.cars?.name} — {selectedBooking.profiles?.full_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="rounded-full shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-8">

              {/* Vehicle checklist */}
              <section>
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
                  <Settings className="w-5 h-5 text-accent" /> Vehicle Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CHECKLIST_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <select
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                        value={checklist[field.key]}
                        onChange={(e) =>
                          setChecklist((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      >
                        {field.options.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-foreground">
                  <CarIcon className="w-5 h-5 text-accent" /> Inspection Notes
                </h3>
                <textarea
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[80px]"
                  placeholder="Additional observations..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </section>

              {/* Surcharges */}
              <section className="bg-muted/30 rounded-2xl p-5 border border-border space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-foreground">
                  <AlertTriangle className="w-5 h-5 text-destructive" /> Surcharges
                </h3>

                {lateFeeDetails.daysLate > 0 && (
                  <div className="flex justify-between items-center text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-sm">
                    <div>
                      <p className="font-bold">Late Return</p>
                      <p className="text-xs opacity-90">
                        {lateFeeDetails.daysLate} day(s) × (base rate + 10%)
                      </p>
                    </div>
                    <p className="font-bold">+ Ksh {lateFeeDetails.fee.toLocaleString()}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Damage Fee</p>
                    <p className="text-xs text-muted-foreground">Enter 0 if none</p>
                  </div>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                      Ksh
                    </span>
                    <Input
                      type="number"
                      min="0"
                      className="pl-10 bg-muted/40 border-border h-10 text-sm rounded-xl"
                      value={damageFee}
                      onChange={(e) => setDamageFee(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-4">
                  <p className="font-bold text-base text-foreground">Total Additional</p>
                  <p className="font-bold text-2xl text-accent">
                    Ksh {totalAdditionalFees.toLocaleString()}
                  </p>
                </div>
              </section>
            </div>

            {/* Sticky footer actions */}
            <div className="flex gap-3 px-6 pb-6 pt-4 sticky bottom-0 bg-card border-t border-border">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11"
                onClick={closeModal}
              >
                Discard
              </Button>
              <Button
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 font-medium"
                onClick={handleProcessReturn}
              >
                {totalAdditionalFees > 0
                  ? "Send STK & Complete Return"
                  : "Complete Return"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}