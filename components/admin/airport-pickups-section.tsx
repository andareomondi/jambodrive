"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Mail,
  Phone,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Search,
  X,
} from "lucide-react";
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

const PICKUP_PAGE_SIZE = 8;

function formatCurrency(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function AirportPickupsSection() {
  const [pickups, setPickups] = useState<AirportPickup[]>([]);
  const [rates, setRates] = useState<AirportPickupRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPickup, setUpdatingPickup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedPickupId, setExpandedPickupId] = useState<string | null>(null);
  const [pickupPage, setPickupPage] = useState(1);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateForm, setRateForm] = useState(EMPTY_RATE);

  const filteredPickups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pickups.filter((pickup) => {
      const matchesSearch =
        !query ||
        [
          pickup.id,
          pickup.airport_name,
          pickup.destination,
          pickup.flight_number,
          pickup.contact_phone,
          pickup.profiles?.full_name,
          pickup.profiles?.email,
        ].some((value) => value?.toLowerCase().includes(query));
      return matchesSearch && (!statusFilter || pickup.status === statusFilter);
    });
  }, [pickups, searchQuery, statusFilter]);
  const pickupTotalPages = Math.max(
    1,
    Math.ceil(filteredPickups.length / PICKUP_PAGE_SIZE),
  );
  const safePickupPage = Math.min(pickupPage, pickupTotalPages);
  const pagedPickups = filteredPickups.slice(
    (safePickupPage - 1) * PICKUP_PAGE_SIZE,
    safePickupPage * PICKUP_PAGE_SIZE,
  );

  useEffect(() => {
    setPickupPage(1);
  }, [searchQuery, statusFilter]);

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
              {pickups.length} request{pickups.length === 1 ? "" : "s"} ·{" "}
              {pickups.filter((pickup) => pickup.status === "requested").length}{" "}
              awaiting acceptance
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
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(220px,1fr)_220px] sm:p-6">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search customer, route, flight, or reference"
              aria-label="Search airport pickup requests"
              className="pl-9"
            />
          </label>
          <label className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter airport pickup requests by status"
              className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All statuses ({pickups.length})</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} (
                  {pickups.filter((pickup) => pickup.status === value).length})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </label>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading airport pickup requests…
            </p>
          ) : pagedPickups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
              <Plane className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">
                {pickups.length === 0
                  ? "No airport pickup requests yet"
                  : "No requests match this search"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {pickups.length === 0
                  ? "New paid requests will appear here."
                  : "Try another search term or choose a different status."}
              </p>
            </div>
          ) : (
            pagedPickups.map((pickup) => {
              const profile = pickup.profiles;
              const expanded = expandedPickupId === pickup.id;
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
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-foreground">
                          {pickup.airport_name} → {pickup.destination}
                        </h3>
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                          {STATUS_LABELS[pickup.status]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {profile?.full_name ?? "Customer"} ·{" "}
                        {pickup.flight_number} · {pickup.contact_phone}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {new Date(pickup.arrival_at).toLocaleString("en-KE")}
                        </span>
                        <span>Ref: {pickup.id.slice(0, 8).toUpperCase()}</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(pickup.fare_amount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
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
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-expanded={expanded}
                        aria-controls={`pickup-details-${pickup.id}`}
                        onClick={() =>
                          setExpandedPickupId(expanded ? null : pickup.id)
                        }
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="mr-1.5 h-4 w-4" />
                            Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-1.5 h-4 w-4" />
                            Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  {updatingPickup === pickup.id && (
                    <p role="status" className="px-5 pb-3 text-xs text-muted-foreground">
                      Updating request status…
                    </p>
                  )}
                  {expanded && (
                    <div
                      id={`pickup-details-${pickup.id}`}
                      className="grid gap-4 border-t border-border bg-muted/20 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:p-5"
                    >
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Customer
                        </h4>
                        <p className="font-medium text-foreground">
                          {profile?.full_name ?? "Unknown customer"}
                        </p>
                        {profile?.email && (
                          <a
                            href={`mailto:${profile.email}`}
                            className="flex items-center gap-2 break-all text-xs text-accent hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            {profile.email}
                          </a>
                        )}
                        <a
                          href={`tel:${pickup.contact_phone}`}
                          className="flex items-center gap-2 text-xs text-accent hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {pickup.contact_phone}
                        </a>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Arrival details
                        </h4>
                        <p>Flight: <span className="font-medium">{pickup.flight_number}</span></p>
                        <p>
                          Arrival:{" "}
                          <span className="font-medium">
                            {new Date(pickup.arrival_at).toLocaleString("en-KE")}
                          </span>
                        </p>
                        <p>
                          Passengers / bags:{" "}
                          <span className="font-medium">
                            {pickup.passenger_count} / {pickup.luggage_count}
                          </span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Payment
                        </h4>
                        <p>
                          Fare: <span className="font-medium">{formatCurrency(pickup.fare_amount)}</span>
                        </p>
                        <p>
                          Payment:{" "}
                          <span className="font-medium capitalize">
                            {pickup.payment_status.replace("_", " ")}
                          </span>
                        </p>
                        {pickup.mpesa_receipt_number && (
                          <p>
                            M-Pesa receipt:{" "}
                            <span className="font-mono font-medium">
                              {pickup.mpesa_receipt_number}
                            </span>
                          </p>
                        )}
                        {pickup.payment_failure_reason && (
                          <p className="text-destructive">
                            {pickup.payment_failure_reason}
                          </p>
                        )}
                      </div>
                      {pickup.customer_notes && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Customer notes
                          </h4>
                          <p className="whitespace-pre-wrap rounded-lg bg-background/70 p-3 text-sm text-foreground">
                            {pickup.customer_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
        {filteredPickups.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(safePickupPage - 1) * PICKUP_PAGE_SIZE + 1}–
                {Math.min(safePickupPage * PICKUP_PAGE_SIZE, filteredPickups.length)}
              </span>{" "}
              of <span className="font-medium text-foreground">{filteredPickups.length}</span>
            </p>
            {pickupTotalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={safePickupPage === 1}
                  onClick={() => setPickupPage(safePickupPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {safePickupPage} of {pickupTotalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={safePickupPage === pickupTotalPages}
                  onClick={() => setPickupPage(safePickupPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
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
