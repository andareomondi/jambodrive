"use client";

import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/auth/supabase-provider";
import {
  processCarReturn,
  initiateFacilitatorCharge,
} from "@/lib/actions/admin-actions";
import { toast } from "sonner";
import {
  Loader2,
  ClipboardCheck,
  AlertTriangle,
  Car,
  Settings,
  Smartphone,
  Wifi,
  XCircle,
  CheckCircle,
} from "lucide-react";
import type { Booking } from "@/lib/mock-data";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PaymentState =
  | "idle"
  | "processing"
  | "waiting_for_pin"
  | "success"
  | "failed";

interface FacilitatorClientProps {
  initialBookings: Booking[];
}

export function FacilitatorClient({ initialBookings }: FacilitatorClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [tireCondition, setTireCondition] = useState("Good");
  const [exteriorCondition, setExteriorCondition] = useState("Good");
  const [interiorCondition, setInteriorCondition] = useState("Clean");
  const [fuelLevel, setFuelLevel] = useState("Full");
  const [customNotes, setCustomNotes] = useState("");
  const [damageFee, setDamageFee] = useState<number>(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const compiledNotesRef = useRef("");
  const totalFeesRef = useRef(0);

  const supabase = useSupabase();

  const lateFeeDetails = useMemo(() => {
    if (!selectedBooking) return { daysLate: 0, fee: 0 };
    const returnDate = new Date(selectedBooking.return_date);
    const today = new Date();
    if (today > returnDate) {
      const daysLate = Math.ceil(
        (today.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        daysLate,
        fee: Math.round(daysLate * (selectedBooking.cars?.price || 0) * 1.1),
      };
    }
    return { daysLate: 0, fee: 0 };
  }, [selectedBooking]);

  const totalAdditionalFees = damageFee + lateFeeDetails.fee;

  const handleProcessReturn = async () => {
    if (!selectedBooking) return;

    const compiledNotes = `
[INSPECTION REPORT]
Tires: ${tireCondition} | Exterior: ${exteriorCondition}
Interior: ${interiorCondition} | Fuel: ${fuelLevel}
---
[FEES]
Damage/Missing: Ksh ${damageFee}
Late Fee (${lateFeeDetails.daysLate} days): Ksh ${lateFeeDetails.fee}
Total Charged: Ksh ${totalAdditionalFees}
---
[NOTES]
${customNotes || "None."}
    `.trim();

    compiledNotesRef.current = compiledNotes;
    totalFeesRef.current = totalAdditionalFees;

    // No fees — skip payment, commit return directly
    if (totalAdditionalFees <= 0) {
      setPaymentState("processing");
      try {
        const res = await processCarReturn(
          selectedBooking.id,
          selectedBooking.car_id,
          compiledNotes,
          0,
        );
        if (!res.success) throw new Error(res.error);
        setPaymentState("success");
        setTimeout(() => {
          setBookings((prev) =>
            prev.filter((b) => b.id !== selectedBooking.id),
          );
          closeModal();
        }, 2500);
      } catch (err: any) {
        setPaymentState("failed");
        setPaymentMessage(err.message || "Failed to complete return.");
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
      const channel = supabase.supabase
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
                  selectedBooking.car_id,
                  compiledNotesRef.current,
                  totalFeesRef.current,
                );
                setPaymentState("success");
                setTimeout(() => {
                  setBookings((prev) =>
                    prev.filter((b) => b.id !== selectedBooking.id),
                  );
                  closeModal();
                }, 2500);
              } catch (err: any) {
                setPaymentState("failed");
                setPaymentMessage(
                  err.message ||
                    "Payment received but failed to complete return.",
                );
              }
            } else if (updated.additional_fee_status === "failed") {
              channel.unsubscribe();
              channelRef.current = null;
              setPaymentState("failed");
              setPaymentMessage(
                updated.additional_fee_reason ||
                  "Payment was cancelled or failed.",
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

      // 90s safety timeout
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
    } catch (err: any) {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      setPaymentState("failed");
      setPaymentMessage(err.message || "Something went wrong.");
    }
  };

  const closeModal = () => {
    if (paymentState === "processing" || paymentState === "waiting_for_pin")
      return;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setSelectedBooking(null);
    setPaymentState("idle");
    setPaymentMessage("");
    setTireCondition("Good");
    setExteriorCondition("Good");
    setInteriorCondition("Clean");
    setFuelLevel("Full");
    setCustomNotes("");
    setDamageFee(0);
    compiledNotesRef.current = "";
    totalFeesRef.current = 0;
  };

  // ── Payment overlay ────────────────────────────────────────────────────────
  const PaymentOverlay = () => {
    if (paymentState === "idle") return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
        <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {paymentState === "processing" && (
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {totalFeesRef.current > 0
                    ? "Connecting to M-Pesa"
                    : "Processing Return"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {totalFeesRef.current > 0
                    ? "Securing connection with Safaricom..."
                    : "Completing vehicle return..."}
                </p>
              </div>
            </div>
          )}
          {paymentState === "waiting_for_pin" && (
            <div className="p-8 flex flex-col items-center text-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse" />
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="relative w-20 h-20 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full flex items-center justify-center shadow-inner">
                  <Smartphone className="w-9 h-9 text-green-600" />
                  <Wifi className="w-4 h-4 text-green-600 absolute top-2 right-2 animate-pulse" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Check Customer's Phone
                </h2>
                <p className="text-sm text-muted-foreground">
                  An M-Pesa prompt has been sent to{" "}
                  <span className="font-medium text-foreground">
                    {selectedBooking?.profiles?.phone}
                  </span>{" "}
                  for{" "}
                  <strong className="text-foreground ml-1">
                    Ksh {totalFeesRef.current.toLocaleString()}
                  </strong>
                  .
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 w-full flex items-center justify-center gap-3">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">
                  Waiting for confirmation...
                </span>
              </div>
            </div>
          )}
          {paymentState === "success" && (
            <div className="p-8 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Return Complete
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Car returned and marked available in the fleet.
                </p>
              </div>
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
                  {paymentMessage || "The payment was cancelled or timed out."}
                </p>
              </div>
              <button
                onClick={() => setPaymentState("idle")}
                className="w-full px-6 py-3 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 mt-10 pb-20">
        <div>
          <h1 className="text-3xl font-bold">Facilitator Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Perform visual inspections and handle balances.
          </p>
        </div>

        <div className="grid gap-4">
          {bookings.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-card rounded-xl border border-border">
              <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No Active Trips</h3>
              <p className="text-muted-foreground">
                All vehicles are back in the garage lot.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-card p-6 rounded-xl border border-border flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm"
              >
                <div>
                  <h3 className="font-bold text-lg">{booking.cars?.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer:{" "}
                    <span className="font-medium text-foreground">
                      {booking.profiles?.full_name}
                    </span>{" "}
                    ({booking.profiles?.phone})
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedBooking(booking)}
                  className="bg-accent hover:bg-accent/90 w-full md:w-auto rounded-xl"
                >
                  Inspect & Return
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Inspection modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <PaymentOverlay />

            {paymentState === "idle" && (
              <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="flex justify-between items-center border-b border-border pb-4 mb-6 sticky top-0 bg-card z-10">
                  <div>
                    <h2 className="text-xl font-bold">Return Inspection</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.cars?.name} (
                      {selectedBooking.profiles?.full_name})
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeModal}
                    className="rounded-full"
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-8">
                  {/* Vehicle checklist */}
                  <section>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <Settings className="w-5 h-5 text-accent" /> Vehicle
                      Checklist
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          label: "Tire Infrastructure",
                          value: tireCondition,
                          onChange: setTireCondition,
                          options: [
                            {
                              value: "Good",
                              label: "Good (Treads match metrics)",
                            },
                            {
                              value: "Worn",
                              label: "Worn (Flagged for replacement)",
                            },
                            {
                              value: "Damaged",
                              label: "Damaged (Puncture/flat)",
                            },
                          ],
                        },
                        {
                          label: "Exterior Panels",
                          value: exteriorCondition,
                          onChange: setExteriorCondition,
                          options: [
                            {
                              value: "Good",
                              label: "Good (Zero new body marks)",
                            },
                            {
                              value: "Minor Scratches",
                              label: "Minor Scratches",
                            },
                            {
                              value: "Dents / Major Damage",
                              label: "Dents / Structural Damage",
                            },
                          ],
                        },
                        {
                          label: "Cabin Interior",
                          value: interiorCondition,
                          onChange: setInteriorCondition,
                          options: [
                            { value: "Clean", label: "Clean (Match on entry)" },
                            {
                              value: "Minor Dirt",
                              label: "Minor Dirt (Standard wash)",
                            },
                            {
                              value: "Damaged",
                              label: "Upholstery stains / tearing",
                            },
                          ],
                        },
                        {
                          label: "Fuel Level",
                          value: fuelLevel,
                          onChange: setFuelLevel,
                          options: [
                            {
                              value: "Full",
                              label: "Full (Match on handover)",
                            },
                            { value: "1/2", label: "Half Tank" },
                            {
                              value: "Empty",
                              label: "Empty (Refuel required)",
                            },
                          ],
                        },
                      ].map((field) => (
                        <div key={field.label} className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">
                            {field.label}
                          </label>
                          <select
                            className="w-full bg-secondary border-none rounded-xl p-3 outline-none appearance-none cursor-pointer text-sm"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            {field.options.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Notes */}
                  <section>
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <Car className="w-5 h-5 text-accent" /> Inspection Notes
                    </h3>
                    <textarea
                      className="w-full bg-secondary border-none rounded-xl p-3 outline-none min-h-[80px] text-sm resize-none"
                      placeholder="Additional observations..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                    />
                  </section>

                  {/* Surcharges */}
                  <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-border space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />{" "}
                      Surcharges
                    </h3>
                    {lateFeeDetails.daysLate > 0 && (
                      <div className="flex justify-between items-center text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-sm">
                        <div>
                          <p className="font-bold">Late Return</p>
                          <p className="text-xs opacity-90">
                            {lateFeeDetails.daysLate} day(s) × (base rate + 10%)
                          </p>
                        </div>
                        <p className="font-bold">
                          + Ksh {lateFeeDetails.fee.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm">
                        <p className="font-medium">Damage Fee</p>
                        <p className="text-xs text-muted-foreground">
                          Enter 0 if none
                        </p>
                      </div>
                      <div className="relative w-36">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                          Ksh
                        </span>
                        <Input
                          type="number"
                          min="0"
                          className="pl-10 bg-white dark:bg-slate-950 border-input h-10 text-sm"
                          value={damageFee}
                          onChange={(e) =>
                            setDamageFee(Number(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-border pt-4">
                      <p className="font-bold text-base">Total Additional</p>
                      <p className="font-bold text-2xl text-accent">
                        Ksh {totalAdditionalFees.toLocaleString()}
                      </p>
                    </div>
                  </section>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-border sticky bottom-0 bg-card">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 text-sm"
                    onClick={closeModal}
                  >
                    Discard
                  </Button>
                  <Button
                    className="flex-1 bg-accent rounded-xl h-11 text-sm text-white font-medium hover:bg-accent/90"
                    onClick={handleProcessReturn}
                  >
                    {totalAdditionalFees > 0
                      ? "Send STK & Complete Return"
                      : "Complete Return"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
