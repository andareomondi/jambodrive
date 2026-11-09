"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  AlertCircle,
  CarFront,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getAdminWeddingEventRequests,
  updateWeddingEventRequestStatus,
} from "@/lib/actions/wedding-events";
import { createClient } from "@/lib/supabase/client";
import type {
  Car,
  WeddingEventRequest,
  WeddingEventRequestStatus,
} from "@/types";

const STATUSES: { value: WeddingEventRequestStatus; label: string }[] = [
  { value: "new", label: "New enquiry" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quote sent" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
];

const STATUS_STYLES: Record<WeddingEventRequestStatus, string> = {
  new: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  contacted: "bg-sky-500/10 text-sky-800 dark:text-sky-300",
  quoted: "bg-violet-500/10 text-violet-800 dark:text-violet-300",
  confirmed: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  declined: "bg-destructive/10 text-destructive",
};

function formatCurrency(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function WeddingEventsSection({
  initialRequests,
  cars,
  initialLoadError,
}: {
  initialRequests: WeddingEventRequest[];
  cars: Car[];
  initialLoadError?: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [statuses, setStatuses] = useState<
    Record<string, WeddingEventRequestStatus>
  >({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const carsById = useMemo(
    () => new Map(cars.map((car) => [car.id, car])),
    [cars],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRequests(await getAdminWeddingEventRequests());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not refresh wedding enquiries.",
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin_wedding_event_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wedding_event_requests" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [refresh]);

  const saveRequest = async (request: WeddingEventRequest) => {
    setSavingId(request.id);
    try {
      const updated = await updateWeddingEventRequestStatus(
        request.id,
        statuses[request.id] ?? request.status,
        notes[request.id] ?? request.admin_notes ?? "",
      );
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setStatuses((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      setNotes((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      toast.success("Wedding enquiry updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update enquiry.",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <CalendarDays className="h-5 w-5 text-accent" />
            Wedding Event Enquiries
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review wedding transport plans, contact couples, and track quote progress.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={refreshing}
          aria-label="Refresh wedding enquiries"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {initialLoadError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <p>{initialLoadError}</p>
          </div>
        )}
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              No wedding enquiries yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New three-step wedding transport requests will appear here.
            </p>
          </div>
        ) : (
          requests.map((request) => {
            const selectedStatus = statuses[request.id] ?? request.status;
            const selectedNotes = notes[request.id] ?? request.admin_notes ?? "";
            const selectedCars = request.sample_car_ids
              .map((id) => carsById.get(id))
              .filter((car): car is Car => Boolean(car));

            return (
              <article
                key={request.id}
                className="overflow-hidden rounded-2xl border border-border"
              >
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between sm:p-5">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {request.contact_name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[request.status]}`}
                      >
                        {STATUSES.find((item) => item.value === request.status)?.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Ref {request.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
                        {new Date(`${request.event_date}T12:00:00`).toLocaleDateString(
                          "en-KE",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 shrink-0 text-accent" />
                        {request.car_count} car{request.car_count === 1 ? "" : "s"}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <CarFront className="h-4 w-4 shrink-0 text-accent" />
                        {request.preferred_car_types.join(", ")}
                      </p>
                      <p className="flex items-center gap-2 font-semibold text-foreground sm:col-span-2 lg:col-span-1">
                        {formatCurrency(request.budget_min)} –{" "}
                        {formatCurrency(request.budget_max)}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground sm:col-span-2 lg:col-span-1">
                        Colour: {request.color_scheme}
                      </p>
                      {request.venue && (
                        <p className="flex items-center gap-2 text-muted-foreground sm:col-span-2 lg:col-span-1">
                          <MapPin className="h-4 w-4 shrink-0 text-accent" />
                          {request.venue}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <a
                        href={`mailto:${request.contact_email}`}
                        className="inline-flex items-center gap-2 break-all text-accent hover:underline"
                      >
                        <Mail className="h-4 w-4 shrink-0" />
                        {request.contact_email}
                      </a>
                      <a
                        href={`tel:${request.contact_phone}`}
                        className="inline-flex items-center gap-2 text-accent hover:underline"
                      >
                        <Phone className="h-4 w-4 shrink-0" />
                        {request.contact_phone}
                      </a>
                    </div>

                    {selectedCars.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Sample fleet cars · inspiration only
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCars.map((car) => (
                            <span
                              key={car.id}
                              className="rounded-lg bg-muted px-3 py-1.5 text-xs text-foreground"
                            >
                              {car.name} {car.available ? "" : "(currently hired)"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {request.notes && (
                      <p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                        {request.notes}
                      </p>
                    )}
                  </div>

                  <div className="grid w-full gap-3 lg:max-w-xs">
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Enquiry status
                      </span>
                      <select
                        value={selectedStatus}
                        onChange={(event) =>
                          setStatuses((current) => ({
                            ...current,
                            [request.id]: event.target
                              .value as WeddingEventRequestStatus,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Internal notes
                      </span>
                      <textarea
                        value={selectedNotes}
                        maxLength={2000}
                        rows={3}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        placeholder="Call notes, quote details, follow-up..."
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>
                    <Button
                      type="button"
                      onClick={() => void saveRequest(request)}
                      disabled={savingId === request.id}
                      className="rounded-xl"
                    >
                      {savingId === request.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save enquiry
                    </Button>
                  </div>
                </div>
                <div className="border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
                  Submitted{" "}
                  {new Date(request.created_at).toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {" · "}Enquiry only—not a vehicle reservation.
                </div>
              </article>
            );
          })
        )}
      </div>
    </Card>
  );
}
