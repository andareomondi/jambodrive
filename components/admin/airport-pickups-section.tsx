"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Plane, Plus, RefreshCw, Save, X } from "lucide-react";
import {
  getAdminAirportPickupData,
  saveAirportPickupRate,
  updateAirportPickupStatus,
} from "@/lib/actions/airport-pickups";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AirportPickup,
  AirportPickupRate,
  AirportPickupStatus,
} from "@/types";

const EMPTY_RATE = {
  airportCode: "",
  airportName: "",
  destination: "",
  fareAmount: "",
  isActive: true,
};

const STATUS_LABELS: Record<AirportPickupStatus, string> = {
  pending_payment: "Awaiting payment",
  payment_failed: "Payment failed",
  requested: "New request",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function formatCurrency(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function AirportPickupsSection() {
  const [pickups, setPickups] = useState<AirportPickup[]>([]);
  const [rates, setRates] = useState<AirportPickupRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPickup, setUpdatingPickup] = useState<string | null>(null);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateForm, setRateForm] = useState(EMPTY_RATE);

  const refresh = useCallback(async () => {
    try {
      const data = await getAdminAirportPickupData();
      setPickups(data.pickups);
      setRates(data.rates);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Could not load airport pickups.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getAdminAirportPickupData();
        if (active) {
          setPickups(data.pickups);
          setRates(data.rates);
        }
      } catch (error: unknown) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load airport pickups.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const supabase = createClient();
    const channel = supabase
      .channel("admin_airport_pickups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "airport_pickups" },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void channel.unsubscribe();
    };
  }, [refresh]);

  const beginEditRate = (rate: AirportPickupRate) => {
    setEditingRateId(rate.id);
    setRateForm({
      airportCode: rate.airport_code,
      airportName: rate.airport_name,
      destination: rate.destination,
      fareAmount: String(rate.fare_amount),
      isActive: rate.is_active,
    });
  };

  const resetRateForm = () => {
    setEditingRateId(null);
    setRateForm(EMPTY_RATE);
  };

  const handleRateSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await saveAirportPickupRate({
        ...(editingRateId ? { id: editingRateId } : {}),
        ...rateForm,
        fareAmount: Number(rateForm.fareAmount),
      });
      setRates((current) => {
        const withoutSaved = current.filter((rate) => rate.id !== saved.id);
        return [...withoutSaved, saved].sort(
          (a, b) =>
            a.airport_name.localeCompare(b.airport_name) ||
            a.destination.localeCompare(b.destination),
        );
      });
      toast.success("Airport route fare saved.");
      resetRateForm();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Could not save route fare.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleRate = async (rate: AirportPickupRate) => {
    try {
      const saved = await saveAirportPickupRate({
        id: rate.id,
        airportCode: rate.airport_code,
        airportName: rate.airport_name,
        destination: rate.destination,
        fareAmount: rate.fare_amount,
        isActive: !rate.is_active,
      });
      setRates((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      toast.success(saved.is_active ? "Route is now available." : "Route disabled.");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Could not update route.",
      );
    }
  };

  const changePickupStatus = async (
    pickup: AirportPickup,
    status: AirportPickupStatus,
  ) => {
    setUpdatingPickup(pickup.id);
    try {
      await updateAirportPickupStatus(pickup.id, status);
      setPickups((current) =>
        current.map((item) =>
          item.id === pickup.id ? { ...item, status } : item,
        ),
      );
      toast.success(`Pickup marked ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Could not update pickup.",
      );
    } finally {
      setUpdatingPickup(null);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-border p-4 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Plane className="h-5 w-5 text-accent" />
              Airport Pickup Requests
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paid requests arrive here live. Update their status as they are handled.
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Rejecting a paid request does not automatically refund M-Pesa; arrange any refund separately.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh airport pickup requests"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading airport pickup requests…
            </p>
          ) : pickups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No airport pickup requests yet.
            </p>
          ) : (
            pickups.map((pickup) => {
              const profile = pickup.profiles;
              const actions: {
                status: AirportPickupStatus;
                label: string;
                icon: typeof Check;
                variant?: "outline";
              }[] =
                pickup.status === "requested"
                  ? [
                      { status: "accepted", label: "Accept", icon: Check },
                      {
                        status: "rejected",
                        label: "Reject",
                        icon: X,
                        variant: "outline",
                      },
                    ]
                  : pickup.status === "accepted"
                    ? [
                        {
                          status: "in_progress",
                          label: "Start transfer",
                          icon: Plane,
                        },
                        {
                          status: "cancelled",
                          label: "Cancel",
                          icon: X,
                          variant: "outline",
                        },
                      ]
                    : pickup.status === "in_progress"
                      ? [
                          {
                            status: "completed",
                            label: "Complete",
                            icon: Check,
                          },
                        ]
                      : [];

              return (
                <article
                  key={pickup.id}
                  className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground">
                          {pickup.airport_name} to {pickup.destination}
                        </h3>
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                          {STATUS_LABELS[pickup.status]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profile?.full_name ?? "Customer"} · {profile?.email ?? "—"}
                      </p>
                      <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <p>
                          <span className="text-muted-foreground">Arrival:</span>{" "}
                          {new Date(pickup.arrival_at).toLocaleString("en-KE")}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Flight:</span>{" "}
                          {pickup.flight_number}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Phone:</span>{" "}
                          {pickup.contact_phone}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Passengers / bags:</span>{" "}
                          {pickup.passenger_count} / {pickup.luggage_count}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Fare:</span>{" "}
                          {formatCurrency(pickup.fare_amount)} ·{" "}
                          {pickup.mpesa_receipt_number ?? "M-Pesa paid"}
                        </p>
                      </div>
                      {pickup.customer_notes && (
                        <p className="rounded-lg bg-background/70 p-3 text-sm text-muted-foreground">
                          {pickup.customer_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {actions.map(({ status, label, icon: Icon, variant }) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={variant ?? "default"}
                          disabled={updatingPickup === pickup.id}
                          onClick={() => void changePickupStatus(pickup, status)}
                        >
                          <Icon className="mr-1.5 h-3.5 w-3.5" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </Card>

      <Card className="overflow-hidden border-border shadow-sm">
        <div className="border-b border-border p-4 sm:p-6">
          <h2 className="text-xl font-bold text-foreground">
            Airport Route Fares
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the destinations and KES prices customers can select.
          </p>
        </div>
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div className="space-y-3">
            {rates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No routes configured yet. Add the first route and fare.
              </p>
            ) : (
              rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {rate.airport_name} ({rate.airport_code}) → {rate.destination}
                    </p>
                    <p className="mt-1 text-sm text-accent">
                      {formatCurrency(rate.fare_amount)}
                      {!rate.is_active && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Disabled
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => beginEditRate(rate)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void toggleRate(rate)}
                    >
                      {rate.is_active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleRateSave}
            className="h-fit space-y-4 rounded-2xl border border-border bg-muted/20 p-4"
          >
            <h3 className="font-semibold text-foreground">
              {editingRateId ? "Edit route fare" : "Add a route"}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="airport-code">Airport code</Label>
              <Input
                id="airport-code"
                value={rateForm.airportCode}
                onChange={(event) =>
                  setRateForm((current) => ({
                    ...current,
                    airportCode: event.target.value,
                  }))
                }
                placeholder="NBO"
                maxLength={12}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airport-name">Airport name</Label>
              <Input
                id="airport-name"
                value={rateForm.airportName}
                onChange={(event) =>
                  setRateForm((current) => ({
                    ...current,
                    airportName: event.target.value,
                  }))
                }
                placeholder="Jomo Kenyatta International Airport"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="route-destination">Destination</Label>
              <Input
                id="route-destination"
                value={rateForm.destination}
                onChange={(event) =>
                  setRateForm((current) => ({
                    ...current,
                    destination: event.target.value,
                  }))
                }
                placeholder="Nairobi CBD"
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="route-fare">Fare (KES)</Label>
              <Input
                id="route-fare"
                type="number"
                min={1}
                step={1}
                value={rateForm.fareAmount}
                onChange={(event) =>
                  setRateForm((current) => ({
                    ...current,
                    fareAmount: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving…" : "Save fare"}
              </Button>
              {editingRateId && (
                <Button type="button" variant="outline" onClick={resetRateForm}>
                  <Plus className="mr-1.5 h-4 w-4 rotate-45" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </Card>
    </section>
  );
}
