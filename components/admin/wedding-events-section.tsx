"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  AlertCircle,
  CarFront,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Search,
  Banknote,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as Dialog from "@radix-ui/react-dialog";
import {
  cancelWeddingEventEnquiry,
  getAdminWeddingEventRequests,
  markWeddingEventContacted,
  saveWeddingEventAdminNotes,
  saveWeddingEventQuote,
} from "@/lib/actions/wedding-events";
import { createClient } from "@/lib/supabase/client";
import { downloadWeddingAgreement } from "@/lib/reports/generate-wedding-agreement";
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
  { value: "cancelled", label: "Cancelled" },
  { value: "spam", label: "Spam" },
];

const STATUS_STYLES: Record<WeddingEventRequestStatus, string> = {
  new: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  contacted: "bg-sky-500/10 text-sky-800 dark:text-sky-300",
  quoted: "bg-violet-500/10 text-violet-800 dark:text-violet-300",
  confirmed: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground",
  spam: "bg-destructive/10 text-destructive",
};

const REQUEST_PAGE_SIZE = 8;

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
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [requestPage, setRequestPage] = useState(1);
  const [contactRequest, setContactRequest] = useState<WeddingEventRequest | null>(null);
  const [selectedContactMethod, setSelectedContactMethod] = useState<"email" | "whatsapp" | "call" | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<WeddingEventRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [paymentRequest, setPaymentRequest] = useState<WeddingEventRequest | null>(null);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [agreementLoadingId, setAgreementLoadingId] = useState<string | null>(null);

  const carsById = useMemo(
    () => new Map(cars.map((car) => [car.id, car])),
    [cars],
  );
  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        [
          request.id,
          request.contact_name,
          request.contact_email,
          request.contact_phone,
          request.venue,
          request.color_scheme,
          ...request.preferred_car_types,
        ].some((value) => value?.toLowerCase().includes(query));
      return matchesSearch && (!statusFilter || request.status === statusFilter);
    });
  }, [requests, searchQuery, statusFilter]);
  const requestTotalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / REQUEST_PAGE_SIZE),
  );
  const safeRequestPage = Math.min(requestPage, requestTotalPages);
  const pagedRequests = filteredRequests.slice(
    (safeRequestPage - 1) * REQUEST_PAGE_SIZE,
    safeRequestPage * REQUEST_PAGE_SIZE,
  );

  useEffect(() => {
    setRequestPage(1);
  }, [searchQuery, statusFilter]);

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

  const handleContact = async (
    request: WeddingEventRequest,
    method: "email" | "whatsapp" | "call",
  ) => {
    setSavingId(request.id);
    try {
      const updated = await markWeddingEventContacted(
        request.id,
        method,
        notes[request.id] ?? request.admin_notes ?? "",
      );
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setContactRequest(null);
      setSelectedContactMethod(null);
      toast.success(`Contact recorded via ${method}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not record contact.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const submitQuote = async () => {
    if (!quoteRequest) return;
    setSavingId(quoteRequest.id);
    try {
      const updated = await saveWeddingEventQuote(
        quoteRequest.id,
        Number(quoteAmount),
        quoteNotes,
        notes[quoteRequest.id] ?? quoteRequest.admin_notes ?? "",
      );
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setQuoteRequest(null);
      setQuoteAmount("");
      setQuoteNotes("");
      toast.success("Quote saved and made available to the customer.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save quote.");
    } finally {
      setSavingId(null);
    }
  };

  const closeAs = async (
    request: WeddingEventRequest,
    status: "cancelled" | "spam",
  ) => {
    setSavingId(request.id);
    try {
      const updated = await cancelWeddingEventEnquiry(
        request.id,
        status,
        notes[request.id] ?? request.admin_notes ?? "",
      );
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(status === "spam" ? "Enquiry marked as spam." : "Enquiry cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not close enquiry.");
    } finally {
      setSavingId(null);
    }
  };

  const saveNotes = async (request: WeddingEventRequest) => {
    setSavingId(request.id);
    try {
      const updated = await saveWeddingEventAdminNotes(
        request.id,
        notes[request.id] ?? request.admin_notes ?? "",
      );
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotes((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      toast.success("Internal notes saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notes.");
    } finally {
      setSavingId(null);
    }
  };

  const requestPayment = async () => {
    if (!paymentRequest) return;
    setPaymentLoading(true);
    try {
      const response = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: paymentPhone,
          weddingEventRequestId: paymentRequest.id,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Could not initiate M-Pesa payment.");
      }
      toast.success("M-Pesa payment prompt sent.");
      setPaymentRequest(null);
      setPaymentPhone("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not initiate payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const downloadAgreement = async (request: WeddingEventRequest) => {
    setAgreementLoadingId(request.id);
    try {
      await downloadWeddingAgreement(request);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download agreement.");
    } finally {
      setAgreementLoadingId(null);
    }
  };

  const launchContact = (
    request: WeddingEventRequest,
    method: "email" | "whatsapp" | "call",
  ) => {
    const message = `Hello ${request.contact_name}, we are following up on your wedding transport enquiry for ${new Date(`${request.event_date}T12:00:00`).toLocaleDateString("en-KE")}.`;
    const digits = request.contact_phone.replace(/\D/g, "");
    const phone = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
    const href =
      method === "email"
        ? `mailto:${request.contact_email}?subject=${encodeURIComponent("Your Cosmara wedding transport enquiry")}&body=${encodeURIComponent(message)}`
        : method === "whatsapp"
          ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
          : `tel:${request.contact_phone}`;

    window.open(href, "_blank", "noopener,noreferrer");
    setSelectedContactMethod(method);
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
            {requests.length} enquir{requests.length === 1 ? "y" : "ies"} ·{" "}
            {requests.filter((request) => request.status === "new").length} new
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

      <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[minmax(220px,1fr)_220px] sm:p-6">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, email, phone, or reference"
            aria-label="Search wedding enquiries"
            className="pl-9"
          />
        </label>
        <label className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter wedding enquiries by status"
            className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All statuses ({requests.length})</option>
            {STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label} (
                {requests.filter((request) => request.status === value).length})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </label>
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
        {pagedRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">
              {requests.length === 0
                ? "No wedding enquiries yet"
                : "No enquiries match this search"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {requests.length === 0
                ? "New three-step wedding transport requests will appear here."
                : "Try another search term or choose a different status."}
            </p>
          </div>
        ) : (
          pagedRequests.map((request) => {
            const selectedNotes = notes[request.id] ?? request.admin_notes ?? "";
            const expanded = expandedRequestId === request.id;
            const selectedCars = request.sample_car_ids
              .map((id) => carsById.get(id))
              .filter((car): car is Car => Boolean(car));

            return (
              <article
                key={request.id}
                className="overflow-hidden rounded-2xl border border-border"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground">
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
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {request.contact_email} · {request.contact_phone}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
                        {new Date(`${request.event_date}T12:00:00`).toLocaleDateString(
                          "en-KE",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                      <span>
                        {request.car_count} car{request.car_count === 1 ? "" : "s"}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(request.budget_min)} –{" "}
                        {formatCurrency(request.budget_max)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-expanded={expanded}
                    aria-controls={`wedding-details-${request.id}`}
                    onClick={() =>
                      setExpandedRequestId(expanded ? null : request.id)
                    }
                    className="shrink-0 self-start sm:self-center"
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

                {expanded && (
                  <div
                    id={`wedding-details-${request.id}`}
                    className="grid gap-5 border-t border-border bg-muted/20 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] sm:p-5"
                  >
                    <div className="min-w-0 space-y-4">
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
                        <p className="flex items-center gap-2 text-muted-foreground">
                          Colour: {request.color_scheme}
                        </p>
                        {request.venue && (
                          <p className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
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
                                className="rounded-lg bg-background px-3 py-1.5 text-xs text-foreground"
                              >
                                {car.name} {car.available ? "" : "(currently hired)"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.notes && (
                        <p className="whitespace-pre-wrap rounded-xl bg-background/70 p-3 text-sm text-muted-foreground">
                          {request.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Submitted{" "}
                        {new Date(request.created_at).toLocaleString("en-KE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {" · "}Enquiry only—not a vehicle reservation.
                      </p>
                    </div>

                  <div className="grid h-fit w-full gap-3">
                    {request.status === "new" && (
                      <>
                        <Button
                          type="button"
                          onClick={() => setContactRequest(request)}
                          disabled={savingId === request.id}
                          className="rounded-xl"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Contact customer
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void closeAs(request, "cancelled")}
                            disabled={savingId === request.id}
                            className="rounded-xl"
                          >
                            Cancel enquiry
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void closeAs(request, "spam")}
                            disabled={savingId === request.id}
                            className="rounded-xl text-destructive"
                          >
                            Mark spam
                          </Button>
                        </div>
                      </>
                    )}
                    {request.status === "contacted" && (
                      <Button
                        type="button"
                        onClick={() => {
                          setQuoteRequest(request);
                          setQuoteAmount(request.quote_amount?.toString() ?? "");
                          setQuoteNotes(request.quote_notes ?? "");
                        }}
                        className="rounded-xl"
                      >
                        <Banknote className="mr-2 h-4 w-4" />
                        Prepare and send quote
                      </Button>
                    )}
                    {request.status === "quoted" && (
                      <>
                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm">
                          <p className="font-semibold text-foreground">
                            Quote: {request.quote_amount ? formatCurrency(request.quote_amount) : "Amount missing"}
                          </p>
                          <p className="mt-1 text-xs capitalize text-muted-foreground">
                            Payment: {request.payment_status}
                            {request.paid_amount ? ` · received ${formatCurrency(request.paid_amount)}` : ""}
                          </p>
                        </div>
                        {request.payment_status === "pending" && (
                          <p className="text-sm text-muted-foreground" role="status">
                            M-Pesa payment request is pending callback confirmation.
                          </p>
                        )}
                        {Number(request.paid_amount ?? 0) > 0 && request.payment_status !== "paid" && (
                          <p className="text-sm text-destructive" role="alert">
                            Payment received ({formatCurrency(request.paid_amount ?? 0)}) did not match the quote. Review the receipt and contact the customer; another automatic charge is disabled to prevent overpayment.
                          </p>
                        )}
                        {request.payment_status !== "paid" &&
                          request.payment_status !== "pending" &&
                          Number(request.paid_amount ?? 0) === 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setPaymentRequest(request);
                              setPaymentPhone(request.mpesa_phone ?? request.contact_phone);
                            }}
                            className="rounded-xl"
                          >
                            <Banknote className="mr-2 h-4 w-4" />
                            Request M-Pesa payment
                          </Button>
                        )}
                        {request.payment_status !== "paid" && request.payment_status !== "pending" && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setQuoteRequest(request);
                              setQuoteAmount(request.quote_amount?.toString() ?? "");
                              setQuoteNotes(request.quote_notes ?? "");
                            }}
                            className="rounded-xl"
                          >
                            Revise quote
                          </Button>
                        )}
                        {request.payment_failure_reason && (
                          <p className="text-xs text-destructive">{request.payment_failure_reason}</p>
                        )}
                      </>
                    )}
                    {request.status === "confirmed" && (
                      <>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Paid and confirmed · {formatCurrency(request.paid_amount ?? request.quote_amount ?? 0)}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void downloadAgreement(request)}
                          disabled={agreementLoadingId === request.id}
                          className="rounded-xl"
                        >
                          {agreementLoadingId === request.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Download agreement PDF
                        </Button>
                      </>
                    )}
                    {(request.status === "cancelled" || request.status === "spam") && (
                      <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                        This enquiry is closed and locked. No further actions are available.
                      </p>
                    )}
                    {request.status !== "cancelled" && request.status !== "spam" && (
                      <>
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
                            placeholder="Call notes, follow-up details..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void saveNotes(request)}
                          disabled={savingId === request.id || selectedNotes === (request.admin_notes ?? "")}
                          className="rounded-xl"
                        >
                          {savingId === request.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save internal notes
                        </Button>
                      </>
                    )}
                  </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
      {filteredRequests.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(safeRequestPage - 1) * REQUEST_PAGE_SIZE + 1}–
              {Math.min(
                safeRequestPage * REQUEST_PAGE_SIZE,
                filteredRequests.length,
              )}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filteredRequests.length}
            </span>
          </p>
          {requestTotalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={safeRequestPage === 1}
                onClick={() => setRequestPage(safeRequestPage - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {safeRequestPage} of {requestTotalPages}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={safeRequestPage === requestTotalPages}
                onClick={() => setRequestPage(safeRequestPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
      <Dialog.Root
        open={Boolean(contactRequest)}
        onOpenChange={(open) => {
          if (!open) {
            setContactRequest(null);
            setSelectedContactMethod(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Close contact options">
              <X className="h-4 w-4" />
            </Dialog.Close>
            <Dialog.Title className="text-lg font-bold text-foreground">
              Contact {contactRequest?.contact_name}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Choose the actual contact action. This enquiry moves to Contacted only when you choose one of these actions.
            </Dialog.Description>
            <div className="mt-5 grid gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => contactRequest && launchContact(contactRequest, "email")}
                disabled={!contactRequest || savingId === contactRequest.id}
                className="justify-start rounded-xl"
              >
                <Mail className="mr-3 h-4 w-4" />
                Send email to {contactRequest?.contact_email}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => contactRequest && launchContact(contactRequest, "whatsapp")}
                disabled={!contactRequest || savingId === contactRequest.id}
                className="justify-start rounded-xl"
              >
                <MessageCircle className="mr-3 h-4 w-4 text-green-600" />
                Message on WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => contactRequest && launchContact(contactRequest, "call")}
                disabled={!contactRequest || savingId === contactRequest.id}
                className="justify-start rounded-xl"
              >
                <Phone className="mr-3 h-4 w-4" />
                Call {contactRequest?.contact_phone}
              </Button>
              {selectedContactMethod && contactRequest && (
                <Button
                  type="button"
                  onClick={() => void handleContact(contactRequest, selectedContactMethod)}
                  disabled={savingId === contactRequest.id}
                  className="mt-2 rounded-xl"
                >
                  {savingId === contactRequest.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Contact succeeded — continue to quote
                </Button>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(quoteRequest)}
        onOpenChange={(open) => {
          if (!open) setQuoteRequest(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Close quote form">
              <X className="h-4 w-4" />
            </Dialog.Close>
            <Dialog.Title className="text-lg font-bold text-foreground">
              {quoteRequest?.status === "quoted" ? "Revise wedding quote" : "Prepare wedding quote"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Save a real quote amount and client-facing details. The customer can then pay this exact amount from their dashboard.
            </Dialog.Description>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Quoted amount (KSh)
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={quoteAmount}
                  onChange={(event) => setQuoteAmount(event.target.value)}
                  placeholder="e.g. 85000"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Quote details for the customer
                <textarea
                  value={quoteNotes}
                  maxLength={2000}
                  rows={4}
                  onChange={(event) => setQuoteNotes(event.target.value)}
                  placeholder="Included vehicles, service hours, route and important conditions"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <Button
                type="button"
                onClick={() => void submitQuote()}
                disabled={!quoteRequest || !quoteAmount || Number(quoteAmount) < 1 || savingId === quoteRequest?.id}
                className="rounded-xl"
              >
                {savingId === quoteRequest?.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save and send quote
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(paymentRequest)}
        onOpenChange={(open) => {
          if (!open) setPaymentRequest(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Close payment form">
              <X className="h-4 w-4" />
            </Dialog.Close>
            <Dialog.Title className="text-lg font-bold text-foreground">
              Request quote payment
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              M-Pesa will request {paymentRequest?.quote_amount ? formatCurrency(paymentRequest.quote_amount) : "the quoted amount"} from this phone number.
            </Dialog.Description>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-foreground">
                Customer M-Pesa phone
                <Input
                  type="tel"
                  value={paymentPhone}
                  onChange={(event) => setPaymentPhone(event.target.value)}
                  placeholder="07XX XXX XXX"
                />
              </label>
              <Button
                type="button"
                onClick={() => void requestPayment()}
                disabled={!paymentPhone.trim() || paymentLoading}
                className="rounded-xl"
              >
                {paymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                Send M-Pesa request
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}
