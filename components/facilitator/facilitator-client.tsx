"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  processCarReturn,
  initiateFacilitatorCharge,
} from "@/lib/actions/facilitator";
import { updateAirportPickupStatus } from "@/lib/actions/airport-pickups";
import { toast } from "sonner";
import {
  Loader2,
  ClipboardCheck,
  AlertTriangle,
  Car as CarIcon,
  Settings,
  Smartphone,
  Wifi,
  XCircle,
  CheckCircle,
  X,
  Phone,
  Search,
  CalendarClock,
  Plane,
  MapPin,
  Users,
  Luggage,
  Clock3,
  ArrowRight,
} from "lucide-react";
import type { AirportPickup, AirportPickupStatus, Booking } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentState =
  "idle" | "processing" | "waiting_for_pin" | "success" | "failed";

type BookingWithCarPrice = Booking & {
  cars: { name: string; image: string | null; price: number } | null;
};

interface FacilitatorClientProps {
  initialBookings: BookingWithCarPrice[];
  initialAirportPickups: AirportPickup[];
  isSuperAdmin: boolean;
}

type OperationsView = "rentals" | "airport";

const PICKUP_NEXT_STATUS: Partial<Record<AirportPickupStatus, AirportPickupStatus>> = {
  requested: "accepted",
  accepted: "in_progress",
  in_progress: "completed",
};

// ── Checklist config ──────────────────────────────────────────────────────────

const CHECKLIST_FIELDS = [
  {
    label: "Tire Infrastructure",
    key: "tire" as const,
    options: [
      { value: "Good", label: "Good (Treads match metrics)" },
      { value: "Worn", label: "Worn (Flagged for replacement)" },
      { value: "Damaged", label: "Damaged (Puncture/flat)" },
    ],
  },
  {
    label: "Exterior Panels",
    key: "exterior" as const,
    options: [
      { value: "Good", label: "Good (Zero new body marks)" },
      { value: "Minor Scratches", label: "Minor Scratches" },
      { value: "Dents / Major Damage", label: "Dents / Structural Damage" },
    ],
  },
  {
    label: "Cabin Interior",
    key: "interior" as const,
    options: [
      { value: "Clean", label: "Clean (Match on entry)" },
      { value: "Minor Dirt", label: "Minor Dirt (Standard wash)" },
      { value: "Damaged", label: "Upholstery stains / tearing" },
    ],
  },
  {
    label: "Fuel Level",
    key: "fuel" as const,
    options: [
      { value: "Full", label: "Full (Match on handover)" },
      { value: "1/2", label: "Half Tank" },
      { value: "Empty", label: "Empty (Refuel required)" },
    ],
  },
] as const;

type ChecklistKey = (typeof CHECKLIST_FIELDS)[number]["key"];
type ChecklistState = Record<ChecklistKey, string>;

const DEFAULT_CHECKLIST: ChecklistState = {
  tire: "Good",
  exterior: "Good",
  interior: "Clean",
  fuel: "Full",
};

// ── Payment overlay ───────────────────────────────────────────────────────────

function PaymentOverlay({
  state,
  message,
  phone,
  amount,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-md p-4">
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
                Check Customer&apos;s Phone
              </h2>
              <p className="text-sm text-muted-foreground">
                An M-Pesa prompt has been sent to{" "}
                <span className="font-medium text-foreground">{phone}</span> for{" "}
                <strong className="text-foreground">
                  Ksh {amount.toLocaleString()}
                </strong>
                .
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
              <h2 className="text-xl font-bold text-foreground">
                Return Complete
              </h2>
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
              <h2 className="text-xl font-bold text-foreground mb-2">
                Payment Failed
              </h2>
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

export function FacilitatorClient({
  initialBookings,
  initialAirportPickups,
  isSuperAdmin,
}: FacilitatorClientProps) {
  const [bookings, setBookings] = useState(initialBookings);
  const [airportPickups, setAirportPickups] = useState(initialAirportPickups);
  const [activeView, setActiveView] = useState<OperationsView>("rentals");
  const [query, setQuery] = useState("");
  const [updatingPickupId, setUpdatingPickupId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithCarPrice | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_CHECKLIST);
  const [customNotes, setCustomNotes] = useState("");
  const [damageFee, setDamageFee] = useState(0);
  const [overridePhone, setOverridePhone] = useState("");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const compiledNotesRef = useRef("");
  const totalFeesRef = useRef(0);

  // ── Late fee calculation (50% extra per day, exempting return day) ────────

  const lateFeeDetails = useMemo(() => {
    if (!selectedBooking) return { daysLate: 0, fee: 0 };
    const returnDate = new Date(selectedBooking.return_date);
    returnDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today > returnDate) {
      // Calculate days late (exempting the expected day of return)
      const diffTime = today.getTime() - returnDate.getTime();
      const daysLate = Math.floor(diffTime / 86_400_000);

      if (daysLate > 0) {
        const dailyRate = selectedBooking.cars?.price ?? 0;
        // 50% extra per day: dailyRate * 1.5 per late day
        const fee = Math.round(daysLate * (dailyRate * 1.5));
        return { daysLate, fee };
      }
    }
    return { daysLate: 0, fee: 0 };
  }, [selectedBooking]);

  const totalAdditionalFees = damageFee + lateFeeDetails.fee;

  const filteredBookings = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return bookings;
    return bookings.filter((booking) =>
      [
        booking.cars?.name,
        booking.profiles?.full_name,
        booking.profiles?.phone,
        booking.pickup_location,
        booking.return_location,
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .some((value) => value.toLowerCase().includes(search)),
    );
  }, [bookings, query]);

  const overdueCount = bookings.filter(
    (booking) => new Date(booking.return_date).getTime() < new Date().setHours(0, 0, 0, 0),
  ).length;

  const handleUpdatePickup = async (
    pickup: AirportPickup,
    status: AirportPickupStatus,
  ) => {
    setUpdatingPickupId(pickup.id);
    try {
      await updateAirportPickupStatus(pickup.id, status);
      setAirportPickups((current) =>
        status === "completed" || status === "rejected"
          ? current.filter((item) => item.id !== pickup.id)
          : current.map((item) =>
              item.id === pickup.id ? { ...item, status } : item,
            ),
      );
      toast.success(
        status === "completed"
          ? "Airport pickup marked complete."
          : `Pickup ${status.replace("_", " ")}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update pickup status.",
      );
    } finally {
      setUpdatingPickupId(null);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("facilitator_airport_pickups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "airport_pickups" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setAirportPickups((current) =>
              current.filter((pickup) => pickup.id !== payload.old.id),
            );
            return;
          }
          const pickup = payload.new as AirportPickup;
          if (
            pickup.payment_status !== "paid" ||
            !["requested", "accepted", "in_progress"].includes(pickup.status)
          ) {
            setAirportPickups((current) =>
              current.filter((item) => item.id !== pickup.id),
            );
            return;
          }
          setAirportPickups((current) => {
            const existing = current.find((item) => item.id === pickup.id);
            if (existing) {
              return current.map((item) =>
                item.id === pickup.id ? { ...existing, ...pickup } : item,
              );
            }
            return [...current, pickup].sort(
              (a, b) =>
                new Date(a.arrival_at).getTime() -
                new Date(b.arrival_at).getTime(),
            );
          });
        },
      )
      .subscribe();
    return () => {
      void channel.unsubscribe();
    };
  }, []);

  // ── Modal Open handler ────────────────────────────────────────────────────

  const handleOpenInspect = (booking: BookingWithCarPrice) => {
    setSelectedBooking(booking);
    setOverridePhone(booking.profiles?.phone ?? "");
    setChecklist(DEFAULT_CHECKLIST);
    setCustomNotes("");
    setDamageFee(0);
  };

  // ── Close + reset ─────────────────────────────────────────────────────────

  const closeModal = useCallback(() => {
    if (paymentState === "processing" || paymentState === "waiting_for_pin")
      return;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setSelectedBooking(null);
    setPaymentState("idle");
    setPaymentMessage("");
    setChecklist(DEFAULT_CHECKLIST);
    setCustomNotes("");
    setDamageFee(0);
    setOverridePhone("");
    compiledNotesRef.current = "";
    totalFeesRef.current = 0;
  }, [paymentState]);

  // ── Build inspection note ────────────────────────────────────────────────

  const buildNotes = () =>
    `
[INSPECTION REPORT]
Tires: ${checklist.tire} | Exterior: ${checklist.exterior}
Interior: ${checklist.interior} | Fuel: ${checklist.fuel}
---
[FEES]
Damage/Missing: Ksh ${damageFee}
Late Fee (${lateFeeDetails.daysLate} days @ +50%/day): Ksh ${lateFeeDetails.fee}
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
          setBookings((prev) =>
            prev.filter((b) => b.id !== selectedBooking.id),
          );
          closeModal();
        }, 2500);
      } catch (err: unknown) {
        setPaymentState("failed");
        setPaymentMessage(
          err instanceof Error ? err.message : "Failed to complete return.",
        );
      }
      return;
    }

    const targetPhone = overridePhone.trim() || selectedBooking.profiles?.phone;
    if (!targetPhone) {
      toast.error(
        "A valid customer phone number is required for M-Pesa STK push.",
      );
      return;
    }

    setPaymentState("processing");
    setPaymentMessage("");

    try {
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
                  setBookings((prev) =>
                    prev.filter((b) => b.id !== selectedBooking.id),
                  );
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
        targetPhone,
        totalAdditionalFees,
        selectedBooking.id.slice(0, 12),
      );

      if (!stkResponse.success) {
        channel.unsubscribe();
        channelRef.current = null;
        throw new Error(stkResponse.error || "STK push failed.");
      }

      setPaymentState("waiting_for_pin");

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
      setPaymentMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:py-10">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-accent/80 p-6 text-white shadow-xl sm:p-9">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-12 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                Operations · {isSuperAdmin ? "Super admin view" : "Facilitator"}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Today&apos;s operations
              </h1>
              <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">
                Keep returns moving and stay ahead of airport arrivals.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/65">Open tasks</p>
              <p className="mt-1 text-2xl font-bold">
                {bookings.length + airportPickups.length}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Active rentals",
              value: bookings.length,
              icon: CarIcon,
              tone: "text-sky-700 bg-sky-500/10",
            },
            {
              label: "Overdue returns",
              value: overdueCount,
              icon: AlertTriangle,
              tone: "text-destructive bg-destructive/10",
            },
            {
              label: "Airport pickups",
              value: airportPickups.length,
              icon: Plane,
              tone: "text-violet-700 bg-violet-500/10",
            },
            {
              label: "Due today",
              value: bookings.filter((booking) => {
                const today = new Date();
                const due = new Date(booking.return_date);
                return (
                  due.getFullYear() === today.getFullYear() &&
                  due.getMonth() === today.getMonth() &&
                  due.getDate() === today.getDate()
                );
              }).length,
              icon: CalendarClock,
              tone: "text-amber-700 bg-amber-500/10",
            },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                  {label}
                </p>
                <span className={`rounded-xl p-2 ${tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-border p-3 sm:p-4">
            <button
              type="button"
              onClick={() => setActiveView("rentals")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeView === "rentals"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <CarIcon className="h-4 w-4" />
              Rental returns
              <span className="rounded-full bg-background/15 px-2 py-0.5 text-xs">
                {bookings.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("airport")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeView === "airport"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Plane className="h-4 w-4" />
              Airport arrivals
              <span className="rounded-full bg-background/15 px-2 py-0.5 text-xs">
                {airportPickups.length}
              </span>
            </button>
          </div>

          {activeView === "rentals" ? (
            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Upcoming returns
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Confirm vehicle condition and settle any return balance.
                  </p>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search car, customer, location..."
                    className="h-10 rounded-xl pl-9"
                  />
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                  <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">
                    {bookings.length ? "No matching rentals" : "No returns to process"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bookings.length
                      ? "Try another name, vehicle, or location."
                      : "Confirmed rentals will appear here, ordered by return date."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredBookings.map((booking) => {
                    const overdue =
                      new Date(booking.return_date).getTime() <
                      new Date().setHours(0, 0, 0, 0);
                    return (
                      <article
                        key={booking.id}
                        className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground">
                              {booking.cars?.name ?? "Vehicle"}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                                overdue
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-accent/10 text-accent"
                              }`}
                            >
                              {overdue ? "Overdue" : "Confirmed"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {booking.profiles?.full_name ?? "Customer"}{" "}
                            {booking.profiles?.phone && `· ${booking.profiles.phone}`}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Due{" "}
                              {new Date(booking.return_date).toLocaleDateString(
                                "en-KE",
                                { day: "numeric", month: "short", year: "numeric" },
                              )}
                            </span>
                            {booking.return_location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {booking.return_location}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleOpenInspect(booking)}
                          className="w-full shrink-0 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
                        >
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Inspect return
                        </Button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Paid airport transfers
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Accept the arrival, mark it in progress, then complete after drop-off.
                  </p>
                </div>
              </div>

              {airportPickups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                  <Plane className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">
                    No airport pickups waiting
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New paid transfers will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {airportPickups.map((pickup) => {
                    const nextStatus = PICKUP_NEXT_STATUS[pickup.status];
                    return (
                      <article
                        key={pickup.id}
                        className="rounded-2xl border border-border p-4 sm:p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-violet-500/10 p-2 text-violet-700">
                                <Plane className="h-4 w-4" />
                              </span>
                              <h3 className="font-bold text-foreground">
                                {pickup.airport_name}{" "}
                                <ArrowRight className="inline h-3.5 w-3.5 text-muted-foreground" />{" "}
                                {pickup.destination}
                              </h3>
                              <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase text-accent">
                                {pickup.status.replace("_", " ")}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                              <span className="inline-flex items-center gap-2">
                                <Clock3 className="h-4 w-4" />
                                {new Date(pickup.arrival_at).toLocaleString(
                                  "en-KE",
                                  { dateStyle: "medium", timeStyle: "short" },
                                )}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Plane className="h-4 w-4" />
                                Flight {pickup.flight_number}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {pickup.passenger_count} passengers
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Luggage className="h-4 w-4" />
                                {pickup.luggage_count} bags
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {pickup.contact_phone}
                              </span>
                              <span>
                                {pickup.profiles?.full_name ?? "Customer"}
                                {pickup.profiles?.email
                                  ? ` · ${pickup.profiles.email}`
                                  : ""}
                              </span>
                            </div>
                            {pickup.customer_notes && (
                              <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                                {pickup.customer_notes}
                              </p>
                            )}
                          </div>
                          {nextStatus && (
                            <div className="flex shrink-0 gap-2">
                              {pickup.status === "requested" && (
                                <Button
                                  variant="outline"
                                  disabled={updatingPickupId === pickup.id}
                                  onClick={() =>
                                    void handleUpdatePickup(pickup, "rejected")
                                  }
                                  className="rounded-xl"
                                >
                                  Reject
                                </Button>
                              )}
                              <Button
                                disabled={updatingPickupId === pickup.id}
                                onClick={() =>
                                  void handleUpdatePickup(pickup, nextStatus)
                                }
                                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                              >
                                {updatingPickupId === pickup.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                {nextStatus === "accepted"
                                  ? "Accept pickup"
                                  : nextStatus === "in_progress"
                                    ? "Mark in progress"
                                    : "Complete transfer"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Rejecting a paid pickup does not automatically refund the customer; arrange any refund separately.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Payment overlay */}
      <PaymentOverlay
        state={paymentState}
        message={paymentMessage}
        phone={overridePhone || selectedBooking?.profiles?.phone}
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
                <h2 className="text-xl font-bold text-foreground">
                  Return Inspection
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedBooking.cars?.name} —{" "}
                  {selectedBooking.profiles?.full_name}
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
              {/* Customer Phone Prompt Field */}
              <section className="bg-muted/30 rounded-2xl p-4 border border-border space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-accent" /> M-Pesa Payment
                  Phone Number
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 254712345678"
                  value={overridePhone}
                  onChange={(e) => setOverridePhone(e.target.value)}
                  className="bg-background border-border rounded-xl h-10 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Verify or update the phone number to prompt the customer for
                  extra return balances.
                </p>
              </section>

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
                          setChecklist((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
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
                  <AlertTriangle className="w-5 h-5 text-destructive" />{" "}
                  Surcharges
                </h3>

                {lateFeeDetails.daysLate > 0 && (
                  <div className="flex justify-between items-center text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-sm">
                    <div>
                      <p className="font-bold">Late Return (+50% per day)</p>
                      <p className="text-xs opacity-90">
                        {lateFeeDetails.daysLate} day(s) late (return day
                        exempted)
                      </p>
                    </div>
                    <p className="font-bold">
                      + Ksh {lateFeeDetails.fee.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Damage Fee</p>
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
                      className="pl-10 bg-muted/40 border-border h-10 text-sm rounded-xl"
                      value={damageFee}
                      onChange={(e) =>
                        setDamageFee(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-4">
                  <p className="font-bold text-base text-foreground">
                    Total Additional
                  </p>
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
