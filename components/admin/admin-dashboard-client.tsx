"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CarModal } from "@/components/admin/car-modal";
import { BookingModal } from "@/components/admin/booking-modal";
import { DeleteCarModal } from "@/components/admin/delete-car-modal";
import { AdminGallerySection } from "@/components/admin/admin-gallery-section";
import type { GalleryEvent } from "@/lib/services/gallery";
import {
  Users,
  Banknote,
  Calendar,
  Car as CarIcon,
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  MessageCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Receipt,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminUpdateBookingStatus,
  adminUpdateCarAvailability,
  adminUpdateUserRole,
  adminDeleteCar,
  fetchAdminCars,
  fetchAdminBookings,
  fetchAdminProfiles,
} from "@/lib/actions/admin";
import type { Car, Booking, Profile, BookingStatus } from "@/types";

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary text-primary-foreground",
  pending: "bg-muted text-muted-foreground border border-border",
  completed: "bg-accent text-accent-foreground",
  cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
  failed: "bg-destructive text-destructive-foreground",
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "pending";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[s] ?? STATUS_STYLES.pending}`}
    >
      {s}
    </span>
  );
}

// ── Pagination hook ───────────────────────────────────────────────────────────

function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [items.length]);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );
  return { paged, page: safePage, totalPages, setPage };
}

// ── Pagination UI ─────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon"
              className={`h-8 w-8 rounded-lg text-sm ${p === page ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── WhatsApp helpers ──────────────────────────────────────────────────────────

function formatKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

function openWhatsApp(phone: string, message: string) {
  const formatted = formatKenyanPhone(phone);
  window.open(
    `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOKINGS_PAGE_SIZE = 8;
const USERS_PAGE_SIZE = 6;
const FLEET_PAGE_SIZE = 6;

// ── Props ─────────────────────────────────────────────────────────────────────

interface AdminDashboardClientProps {
  initialCars: Car[];
  initialBookings: Booking[];
  initialProfiles: Profile[];
  initialGalleryEvents?: GalleryEvent[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboardClient({
  initialCars,
  initialBookings,
  initialProfiles,
  initialGalleryEvents,
}: AdminDashboardClientProps) {
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);

  const [carModalOpen, setCarModalOpen] = useState(false);
  const [carModalMode, setCarModalMode] = useState<
    "add" | "edit" | "duplicate"
  >("add");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalRevenue = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + b.total_price, 0),
    [bookings],
  );

  const totalAdditionalFees = useMemo(
    () =>
      bookings
        .filter((b) => b.additional_fee_status === "confirmed")
        .reduce((sum, b) => sum + (b.additional_fee_amount ?? 0), 0),
    [bookings],
  );

  const totalFailed = useMemo(
    () => bookings.filter((b) => b.status === "failed").length,
    [bookings],
  );
  const totalCustomers = useMemo(
    () => profiles.filter((p) => p.role === "customer").length,
    [profiles],
  );

  // ── Filtered bookings ─────────────────────────────────────────────────────

  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          b.cars?.name.toLowerCase().includes(q) ||
          b.profiles?.full_name?.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q);
        const matchStatus = !statusFilter || b.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [bookings, searchQuery, statusFilter],
  );

  const bookingsPagination = usePagination(
    filteredBookings,
    BOOKINGS_PAGE_SIZE,
  );
  const profilesPagination = usePagination(profiles, USERS_PAGE_SIZE);
  const fleetPagination = usePagination(cars, FLEET_PAGE_SIZE);

  // ── Refresh helpers ───────────────────────────────────────────────────────

  const refreshCars = useCallback(
    () =>
      fetchAdminCars()
        .then(setCars)
        .catch((e) => toast.error(e.message)),
    [],
  );
  const refreshBookings = useCallback(
    () =>
      fetchAdminBookings()
        .then(setBookings)
        .catch((e) => toast.error(e.message)),
    [],
  );
  const refreshProfiles = useCallback(
    () =>
      fetchAdminProfiles()
        .then(setProfiles)
        .catch((e) => toast.error(e.message)),
    [],
  );

  // ── Mutations ─────────────────────────────────────────────────────────────

  const handleBookingStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      try {
        const { booking, carId } = await adminUpdateBookingStatus(id, status);

        // Optimistic UI update
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b)),
        );

        // Keep car availability in sync
        if (carId) {
          const available = status === "cancelled";
          await adminUpdateCarAvailability(carId, available);
          setCars((prev) =>
            prev.map((c) => (c.id === carId ? { ...c, available } : c)),
          );
        }

        toast.success(
          `Booking ${status === "confirmed" ? "confirmed" : "rejected"}.`,
        );
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    },
    [],
  );

  const handleDismissFailed = useCallback(async (id: string) => {
    try {
      await adminUpdateBookingStatus(id, "cancelled");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
      );
      toast.success("Failed booking dismissed.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }, []);

  const handleRoleChange = useCallback(async (userId: string, role: string) => {
    try {
      await adminUpdateUserRole(userId, role);
      setProfiles((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: role as Profile["role"] } : u,
        ),
      );
      toast.success("Role updated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }, []);

  const handleAddCar = () => {
    setSelectedCar(null);
    setCarModalMode("add");
    setCarModalOpen(true);
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setCarModalMode("edit");
    setCarModalOpen(true);
  };

  const handleDuplicateCar = (car: Car) => {
    setSelectedCar(car);
    setCarModalMode("duplicate");
    setCarModalOpen(true);
  };

  const openDeleteConfirm = (car: Car) => {
    setCarToDelete(car);
    setDeleteModalOpen(true);
  };
  const toggleExpandRow = (id: string) =>
    setExpandedBookingId((prev) => (prev === id ? null : id));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Super Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your fleet, users, and bookings.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { icon: Calendar, label: "Bookings", value: bookings.length },
            {
              icon: Banknote,
              label: "Base Revenue",
              value: `Ksh ${totalRevenue.toLocaleString()}`,
            },
            {
              icon: Receipt,
              label: "Extra Fees",
              value: `Ksh ${totalAdditionalFees.toLocaleString()}`,
            },
            { icon: CarIcon, label: "Fleet", value: cars.length },
            { icon: Users, label: "Customers", value: totalCustomers },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-4 sm:p-5 border-border shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {label}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {value}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-accent/10 hidden sm:flex">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Process Returns shortcut — links admin directly to the facilitator tool */}
        {bookings.filter((b) => b.status === "confirmed").length > 0 && (
          <Link
            href="/dashboard/facilitator"
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {bookings.filter((b) => b.status === "confirmed").length}{" "}
                  confirmed booking
                  {bookings.filter((b) => b.status === "confirmed").length !== 1
                    ? "s"
                    : ""}{" "}
                  ready for return
                </p>
                <p className="text-xs text-muted-foreground">
                  Use the facilitator tool to process vehicle inspections and
                  returns
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Failed payments banner */}
        {totalFailed > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              {totalFailed} booking{totalFailed > 1 ? "s" : ""} failed payment.{" "}
              <button
                className="underline underline-offset-2 hover:opacity-80"
                onClick={() => setStatusFilter("failed")}
              >
                Filter to view
              </button>
            </p>
          </div>
        )}

        {/* ── Bookings table ────────────────────────────────────────────────── */}
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Recent Bookings
              </h2>
              <Button
                onClick={() => setBookingModalOpen(true)}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" /> New Booking
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search ID, customer, or car..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/40 border-border rounded-xl h-11"
                />
              </div>
              <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 h-11 rounded-xl bg-muted/40 border border-border text-foreground text-sm focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  {[
                    "ID",
                    "Vehicle",
                    "Customer",
                    "Dates",
                    "Amount",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left font-semibold text-foreground px-4 py-3 first:pl-6 last:pr-6 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookingsPagination.paged.length > 0 ? (
                  bookingsPagination.paged.map((booking) => (
                    <React.Fragment key={booking.id}>
                      <tr
                        className={`hover:bg-muted/30 cursor-pointer transition-colors ${booking.status === "failed" ? "bg-destructive/5" : ""}`}
                        onClick={() => toggleExpandRow(booking.id)}
                      >
                        <td className="px-4 py-3 pl-6 font-medium text-foreground whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {expandedBookingId === booking.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                            #{booking.id.slice(0, 6).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">
                          {booking.cars?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">
                          {booking.profiles?.full_name ?? "Walk-in"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(booking.pickup_date).toLocaleDateString(
                            "en-KE",
                            { month: "short", day: "numeric" },
                          )}{" "}
                          →{" "}
                          {new Date(booking.return_date).toLocaleDateString(
                            "en-KE",
                            { month: "short", day: "numeric" },
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                          Ksh {booking.total_price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                        </td>
                        <td
                          className="px-4 py-3 pr-6 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-2 items-center">
                            {booking.status === "pending" && (
                              <>
                                <Button
  size="sm"
  className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 px-3 rounded-lg"
  onClick={(e) => {
    e.stopPropagation(); // Prevents the row from expanding when clicking the button
    setSelectedBooking(booking);
    setBookingModalOpen(true);
  }}
>
  Approve & Pay
</Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10 h-8 px-3 rounded-lg"
                                  onClick={() =>
                                    handleBookingStatus(booking.id, "cancelled")
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-accent/30 text-accent hover:bg-accent/10 h-8 px-3 rounded-lg flex items-center gap-1.5"
                                  onClick={() => {
                                    const phone =
                                      booking.profiles?.phone ??
                                      booking.mpesa_phone;
                                    if (!phone) {
                                      toast.error(
                                        "No phone number for this booking.",
                                      );
                                      return;
                                    }
                                    openWhatsApp(
                                      phone,
                                      `Hello, we have confirmed your booking.\n\n*Booking Details:*\n🚗 Vehicle: ${booking.cars?.name}\n📅 Pickup: ${new Date(booking.pickup_date).toLocaleDateString("en-KE")}\n📍 Location: ${booking.pickup_location}\n💰 Total: KES ${booking.total_price.toLocaleString()}\n\nPlease let us know if you have any questions!`,
                                    );
                                  }}
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />{" "}
                                  Notify
                                </Button>
                                <Link href="/dashboard/facilitator">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-border text-foreground hover:bg-muted h-8 px-3 rounded-lg flex items-center gap-1.5"
                                  >
                                    <ClipboardCheck className="h-3.5 w-3.5" />{" "}
                                    Return
                                  </Button>
                                </Link>
                              </>
                            )}
                            {booking.status === "failed" && (
                              <>
                                {booking.payment_failure_reason && (
                                  <span
                                    title={booking.payment_failure_reason}
                                    className="inline-flex items-center gap-1 text-xs text-destructive cursor-default"
                                  >
                                    <AlertCircle className="h-3.5 w-3.5" /> Why?
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 px-3 rounded-lg gap-1.5"
                                  onClick={() =>
                                    handleDismissFailed(booking.id)
                                  }
                                >
                                  <RotateCcw className="h-3.5 w-3.5" /> Dismiss
                                </Button>
                              </>
                            )}
                            {(booking.status === "completed" ||
                              booking.status === "cancelled") && (
                              <span className="text-xs text-muted-foreground px-2">
                                Processed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expandedBookingId === booking.id && (
                        <tr className="border-0">
                          <td colSpan={7} className="p-0 pb-2">
                            <div className="mx-4 mb-2 rounded-b-xl border border-t-2 border-t-accent/50 border-border bg-muted/20 overflow-hidden">
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                                {/* Logistics */}
                                <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />{" "}
                                    Logistics
                                  </p>
                                  <div className="space-y-1.5 text-sm">
                                    {[
                                      ["Pickup", booking.pickup_location],
                                      ["Return", booking.return_location],
                                      [
                                        "Days",
                                        booking.days
                                          ? `${booking.days} days`
                                          : "—",
                                      ],
                                      [
                                        "Insurance",
                                        booking.insurance ? "Yes" : "No",
                                      ],
                                    ].map(([k, v]) => (
                                      <p
                                        key={k}
                                        className="text-muted-foreground"
                                      >
                                        <span className="font-medium text-foreground">
                                          {k}:{" "}
                                        </span>
                                        {v}
                                      </p>
                                    ))}
                                    {booking.notes && (
                                      <p className="text-muted-foreground pt-1 border-t border-border">
                                        <span className="font-medium text-foreground">
                                          Notes:{" "}
                                        </span>
                                        {booking.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Payment */}
                                <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Banknote className="h-3.5 w-3.5" /> Initial
                                    Payment
                                  </p>
                                  <div className="space-y-1.5 text-sm">
                                    {[
                                      [
                                        "MPesa Receipt",
                                        booking.mpesa_receipt_number,
                                      ],
                                      ["MPesa Phone", booking.mpesa_phone],
                                      [
                                        "Amount Paid",
                                        booking.paid_amount
                                          ? `Ksh ${Number(booking.paid_amount).toLocaleString()}`
                                          : null,
                                      ],
                                    ].map(([k, v]) => (
                                      <p
                                        key={k as string}
                                        className="text-muted-foreground"
                                      >
                                        <span className="font-medium text-foreground">
                                          {k}:{" "}
                                        </span>
                                        {v ?? (
                                          <span className="italic text-muted-foreground/60">
                                            N/A
                                          </span>
                                        )}
                                      </p>
                                    ))}
                                  </div>
                                </div>

                                {/* Extra fees */}
                                <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 sm:col-span-2 xl:col-span-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Receipt className="h-3.5 w-3.5" /> Extra
                                    Fees
                                  </p>
                                  {booking.additional_fee_amount ? (
                                    <div
                                      className={`rounded-lg border p-3 text-sm space-y-1 ${
                                        booking.additional_fee_status ===
                                        "confirmed"
                                          ? "bg-accent/10 border-accent/30"
                                          : "bg-muted/50 border-border"
                                      }`}
                                    >
                                      <p className="font-medium text-foreground">
                                        Ksh{" "}
                                        {Number(
                                          booking.additional_fee_amount,
                                        ).toLocaleString()}{" "}
                                        collected
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">
                                          Status:{" "}
                                        </span>
                                        {booking.additional_fee_status}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">
                                          Receipt:{" "}
                                        </span>
                                        {booking.additional_fee_receipt ?? (
                                          <span className="italic">
                                            Pending
                                          </span>
                                        )}
                                      </p>
                                      {booking.additional_fee_reason && (
                                        <p className="text-xs text-destructive pt-1 border-t border-destructive/20">
                                          <span className="font-medium">
                                            Error:{" "}
                                          </span>
                                          {booking.additional_fee_reason}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                      No extra return fees recorded.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/40" />
                        <p>No bookings found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={bookingsPagination.page}
            totalPages={bookingsPagination.totalPages}
            onPageChange={bookingsPagination.setPage}
            totalItems={filteredBookings.length}
            pageSize={BOOKINGS_PAGE_SIZE}
          />
        </Card>

        {/* ── Users ───────────────────────────────────────────────────────── */}
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">
              User Directory
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {profilesPagination.paged.map((u) => (
                <div
                  key={u.id}
                  className="border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-accent/30 hover:shadow-sm transition-all bg-muted/20"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      {u.profile_image ? (
                        <Image
                          src={u.profile_image}
                          alt={u.full_name ?? ""}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {u.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {u.email}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-muted border border-border text-muted-foreground">
                          {u.role?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{" "}
                          {u.total_bookings ?? 0} trips
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-xl"
                      onClick={() => {
                        if (!u.phone) {
                          toast.error("No phone number on file.");
                          return;
                        }
                        openWhatsApp(
                          u.phone,
                          "Hello, this is the admin from Cosmara.",
                        );
                      }}
                    >
                      <MessageCircle className="h-4 w-4" /> Message
                    </Button>
                    <select
                      value={u.role ?? "customer"}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="flex-1 sm:flex-none text-xs px-3 py-2 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-accent/50 cursor-pointer"
                    >
                      <option value="customer">Customer</option>
                      <option value="facilitator">Facilitator</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Pagination
            page={profilesPagination.page}
            totalPages={profilesPagination.totalPages}
            onPageChange={profilesPagination.setPage}
            totalItems={profiles.length}
            pageSize={USERS_PAGE_SIZE}
          />
        </Card>

        {/* ── Fleet ───────────────────────────────────────────────────────── */}
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">
                Fleet Management
              </h2>
              <Button
                onClick={handleAddCar}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Vehicle
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {fleetPagination.paged.map((car) => (
                <div
                  key={car.id}
                  className="group rounded-2xl overflow-hidden border border-border bg-muted/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    {car.image ? (
                      <Image
                        src={car.image}
                        alt={car.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CarIcon className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {car.available ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent text-accent-foreground shadow-sm">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/70 text-white shadow-sm">
                          Rented
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-lg text-foreground leading-tight">
                          {car.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {car.model}
                        </p>
                      </div>
                      <p className="font-bold text-accent text-sm">
                        Ksh {car.price.toLocaleString()}
                        <span className="text-xs text-muted-foreground font-normal">
                          /d
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border px-2"
                        onClick={() => handleEditCar(car)}
                      >
                        <Edit className="h-3.5 w-3.5 sm:mr-1.5" />{" "}
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border px-2"
                        onClick={() => handleDuplicateCar(car)}
                      >
                        <Copy className="h-3.5 w-3.5 sm:mr-1.5" />{" "}
                        <span className="hidden sm:inline">Copy</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-transparent px-2"
                        onClick={() => openDeleteConfirm(car)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />{" "}
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <Link
                        href={`/cars/${car.id}`}
                        className="text-sm text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
                      >
                        View Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Pagination
            page={fleetPagination.page}
            totalPages={fleetPagination.totalPages}
            onPageChange={fleetPagination.setPage}
            totalItems={cars.length}
            pageSize={FLEET_PAGE_SIZE}
          />
        </Card>

        {/* ── Gallery events ───────────────────────────────────────────── */}
        <AdminGallerySection initialEvents={initialGalleryEvents} />
      </main>

      {/* Modals */}
      <DeleteCarModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCarToDelete(null);
        }}
        onSuccess={refreshCars}
        carId={carToDelete?.id ?? null}
        carName={carToDelete?.name ?? ""}
        imageUrls={[
          ...(carToDelete?.image ? [carToDelete.image] : []),
          ...(carToDelete?.images ?? []),
        ]}
      />
      <CarModal
        open={carModalOpen}
        onOpenChange={setCarModalOpen}
        car={selectedCar}
        mode={carModalMode}
        onSuccess={refreshCars}
      />
<BookingModal
  open={bookingModalOpen}
  onOpenChange={(open) => {
    setBookingModalOpen(open);
    if (!open) setSelectedBooking(null); // Clear the booking when closed
  }}
  onSuccess={() => {
    refreshCars();
    refreshBookings();
    setSelectedBooking(null);
  }}
  booking={selectedBooking}
/>
    </div>
  );
}
