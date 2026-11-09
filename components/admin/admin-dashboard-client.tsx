"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CarModal } from "@/components/admin/car-modal";
import { DeleteCarModal } from "@/components/admin/delete-car-modal";
import { AdminGallerySection } from "@/components/admin/admin-gallery-section";
import { AirportPickupsSection } from "@/components/admin/airport-pickups-section";
import { WeddingEventsSection } from "@/components/admin/wedding-events-section";
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
  MessageCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Receipt,
  Loader2,
  Phone,
  Mail,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  adminUpdateBookingStatus,
  adminUpdateUserRole,
  fetchAdminCars,
  fetchAdminBookings,
  fetchAdminProfiles,
} from "@/lib/actions/admin";
import type {
  Car,
  Booking,
  Profile,
  BookingStatus,
  WeddingEventRequest,
} from "@/types";

// ── Props Interface ───────────────────────────────────────────────────────────

export interface AdminDashboardClientProps {
  initialCars: Car[];
  initialBookings: Booking[];
  initialProfiles: Profile[];
  initialGalleryEvents?: GalleryEvent[];
  initialWeddingEventRequests: WeddingEventRequest[];
  weddingEventLoadError?: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary text-primary-foreground",
  pending: "bg-muted text-muted-foreground border border-border",
  completed: "bg-accent text-accent-foreground",
  cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
  failed: "bg-destructive text-destructive-foreground",
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "pending";
  const label =
    s === "pending"
      ? "Pending payment"
      : s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[s] ?? STATUS_STYLES.pending}`}
    >
      {label}
    </span>
  );
}

function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [items]);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );
  return { paged, page: safePage, totalPages, setPage };
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

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
        <span className="text-xs px-2 font-medium">
          Page {page} of {totalPages}
        </span>
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

function openWhatsApp(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const formatted = digits.startsWith("0") ? "254" + digits.slice(1) : digits;
  window.open(
    `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
}

function FleetCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="rounded-2xl overflow-hidden border border-border bg-card/60 p-4 space-y-4 h-[340px] flex flex-col justify-between"
        >
          <div className="w-full h-44 bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded-md" />
            <div className="h-3 w-1/2 bg-muted/70 rounded-md" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <div className="h-9 flex-1 bg-muted rounded-xl" />
            <div className="h-9 w-12 bg-muted rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AdminDashboardClient({
  initialCars,
  initialBookings,
  initialProfiles,
  initialGalleryEvents,
  initialWeddingEventRequests,
  weddingEventLoadError,
}: AdminDashboardClientProps) {
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [isLoadingFleet, setIsLoadingFleet] = useState(false);

  const [carModalOpen, setCarModalOpen] = useState(false);
  const [carModalMode, setCarModalMode] = useState<
    "add" | "edit" | "duplicate"
  >("add");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

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
  const totalCustomers = useMemo(
    () => profiles.filter((p) => p.role === "customer").length,
    [profiles],
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        b.cars?.name?.toLowerCase().includes(q) ||
        b.profiles?.full_name?.toLowerCase().includes(q) ||
        b.profiles?.email?.toLowerCase().includes(q) ||
        b.profiles?.phone?.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q);
      const matchStatus = !statusFilter || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const bookingsPagination = usePagination(filteredBookings, 8);
  const profilesPagination = usePagination(profiles, 6);
  const fleetPagination = usePagination(cars, 6);

  const refreshCars = useCallback(async () => {
    setIsLoadingFleet(true);
    try {
      const data = await fetchAdminCars();
      setCars(data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Could not load vehicles.",
      );
    } finally {
      setIsLoadingFleet(false);
    }
  }, []);

  const refreshBookings = useCallback(
    () =>
      fetchAdminBookings()
        .then(setBookings)
        .catch((e) => toast.error(e.message)),
    [],
  );

  const handleBookingStatusChange = useCallback(
    async (booking: Booking, status: BookingStatus) => {
      if (booking.status === status) return;
      setUpdatingBookingId(booking.id);
      try {
        const result = await adminUpdateBookingStatus(booking.id, status);
        setBookings((current) =>
          current.map((item) =>
            item.id === booking.id ? { ...item, ...result.booking } : item,
          ),
        );
        toast.success(`Booking marked ${status}.`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update booking.",
        );
      } finally {
        setUpdatingBookingId(null);
      }
    },
    [],
  );
  const refreshProfiles = useCallback(
    () =>
      fetchAdminProfiles()
        .then(setProfiles)
        .catch((e) => toast.error(e.message)),
    [],
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin_dashboard_records")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => void refreshBookings(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => void refreshProfiles(),
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [refreshBookings, refreshProfiles]);

  const handleRoleChange = useCallback(async (userId: string, role: string) => {
    try {
      await adminUpdateUserRole(userId, role);
      setProfiles((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: role as Profile["role"] } : u,
        ),
      );
      toast.success("User role updated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Role update failed");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage fleet assets, user directories, and active bookings
            seamlessly.
          </p>
        </div>

        {/* Stats Grid */}
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
              <div className="flex items-center justify-between">
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

        {/* ── Fleet Management Section ── */}
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Fleet Management
            </h2>
            <Button
              onClick={() => {
                setSelectedCar(null);
                setCarModalMode("add");
                setCarModalOpen(true);
              }}
              className="bg-accent text-accent-foreground rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Vehicle
            </Button>
          </div>

          <div className="p-4 sm:p-6">
            {isLoadingFleet ? (
              <FleetCardSkeletonGrid />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {fleetPagination.paged.map((car) => (
                  <div
                    key={car.id}
                    className="group rounded-2xl overflow-hidden border border-border bg-muted/20 hover:shadow-md transition-all"
                  >
                    <div className="relative h-48 w-full bg-muted">
                      {car.image && (
                        <AppImage
                          src={car.image}
                          alt={car.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-base text-foreground">
                          {car.name} {car.model}
                        </h3>
                        <p className="text-xs text-accent font-semibold">
                          Ksh {car.price.toLocaleString()} / day
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl"
                          onClick={() => {
                            setSelectedCar(car);
                            setCarModalMode("edit");
                            setCarModalOpen(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit & Photos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive rounded-xl"
                          onClick={() => {
                            setCarToDelete(car);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Pagination
            page={fleetPagination.page}
            totalPages={fleetPagination.totalPages}
            onPageChange={fleetPagination.setPage}
            totalItems={cars.length}
            pageSize={6}
          />
        </Card>

        {/* ── User Directory Section ── */}
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
                  className="border border-border rounded-2xl p-4 flex items-center justify-between gap-4 bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {u.profile_image ? (
                        <AppImage
                          src={u.profile_image}
                          alt=""
                          width={44}
                          height={44}
                          className="object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">
                        {u.full_name ?? "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-accent/10 text-accent">
                        {u.role ?? "customer"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openWhatsApp(u.phone!, "Hello from Cosmara Admin")
                        }
                        className="rounded-xl"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                      </Button>
                    )}
                    <select
                      value={u.role ?? "customer"}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-border bg-background"
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
            pageSize={6}
          />
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <Calendar className="h-5 w-5 text-accent" />
                Booking Management
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review rental requests, payment outcomes, and update booking status.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px] lg:w-[470px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search customer, car, phone, or ID"
                  aria-label="Search bookings"
                  className="pl-9"
                />
              </div>
              <label className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter bookings by status"
                  className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All statuses ({bookings.length})</option>
                  {(
                    [
                      ["pending", "Pending payment"],
                      ["confirmed", "Confirmed"],
                      ["completed", "Completed"],
                      ["cancelled", "Cancelled"],
                      ["failed", "Failed"],
                    ] as const
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label} (
                      {bookings.filter((booking) => booking.status === value).length})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </label>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-6">
            {bookingsPagination.paged.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">
                  {bookings.length === 0
                    ? "No bookings yet"
                    : "No bookings match this search"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bookings.length === 0
                    ? "Customer and staff bookings will appear here."
                    : "Try another search term or choose a different status."}
                </p>
              </div>
            ) : (
              bookingsPagination.paged.map((booking) => {
                const expanded = expandedBookingId === booking.id;
                const updating = updatingBookingId === booking.id;
                const status = booking.status ?? "pending";
                return (
                  <article
                    key={booking.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-foreground">
                            {booking.cars?.name ?? "Vehicle"}
                          </h3>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {booking.profiles?.full_name ?? "Customer"}{" "}
                          {booking.profiles?.email
                            ? `· ${booking.profiles.email}`
                            : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {new Date(booking.pickup_date).toLocaleDateString(
                              "en-KE",
                              { day: "numeric", month: "short", year: "numeric" },
                            )}{" "}
                            →{" "}
                            {new Date(booking.return_date).toLocaleDateString(
                              "en-KE",
                              { day: "numeric", month: "short", year: "numeric" },
                            )}
                          </span>
                          <span>Ref: {booking.id.slice(0, 8).toUpperCase()}</span>
                          <span className="font-semibold text-foreground">
                            KSh {booking.total_price.toLocaleString("en-KE")}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <label className="sr-only" htmlFor={`booking-status-${booking.id}`}>
                          Update status for booking {booking.id.slice(0, 8)}
                        </label>
                        <select
                          id={`booking-status-${booking.id}`}
                          value={status}
                          disabled={updating}
                          onChange={(event) =>
                            void handleBookingStatusChange(
                              booking,
                              event.target.value as BookingStatus,
                            )
                          }
                          className="h-9 min-w-36 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                        >
                          <option value="pending">Pending payment</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="failed">Failed</option>
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-expanded={expanded}
                          aria-controls={`booking-details-${booking.id}`}
                          onClick={() =>
                            setExpandedBookingId(expanded ? null : booking.id)
                          }
                          className="rounded-lg"
                        >
                          {expanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide details
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Details
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {updating && (
                      <p role="status" className="flex items-center gap-2 px-5 pb-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating booking status…
                      </p>
                    )}

                    {expanded && (
                      <div
                        id={`booking-details-${booking.id}`}
                        className="grid gap-4 border-t border-border bg-muted/20 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:p-5"
                      >
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Customer
                          </h4>
                          <p className="font-medium text-foreground">
                            {booking.profiles?.full_name ?? "Unknown customer"}
                          </p>
                          {booking.profiles?.email && (
                            <a
                              href={`mailto:${booking.profiles.email}`}
                              className="flex items-center gap-2 break-all text-xs text-accent hover:underline"
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {booking.profiles.email}
                            </a>
                          )}
                          {booking.profiles?.phone && (
                            <a
                              href={`tel:${booking.profiles.phone}`}
                              className="flex items-center gap-2 text-xs text-accent hover:underline"
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              {booking.profiles.phone}
                            </a>
                          )}
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Rental itinerary
                          </h4>
                          <p className="text-foreground">
                            Pickup:{" "}
                            <span className="font-medium">
                              {booking.pickup_location}
                            </span>
                          </p>
                          <p className="text-foreground">
                            Return:{" "}
                            <span className="font-medium">
                              {booking.return_location}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.days ??
                              Math.max(
                                1,
                                Math.ceil(
                                  (new Date(booking.return_date).getTime() -
                                    new Date(booking.pickup_date).getTime()) /
                                    86_400_000,
                                ),
                              )}{" "}
                            rental day(s)
                            {booking.insurance ? " · Insurance included" : ""}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Payment
                          </h4>
                          <p>
                            Status:{" "}
                            <span className="font-medium capitalize text-foreground">
                              {status === "pending"
                                ? "Pending"
                                : status === "confirmed" || status === "completed"
                                  ? "Paid / confirmed"
                                  : status}
                            </span>
                          </p>
                          {booking.paid_amount != null && (
                            <p>
                              Amount paid:{" "}
                              <span className="font-medium text-foreground">
                                KSh {booking.paid_amount.toLocaleString("en-KE")}
                              </span>
                            </p>
                          )}
                          {booking.mpesa_phone && (
                            <p className="text-xs text-muted-foreground">
                              M-Pesa phone: {booking.mpesa_phone}
                            </p>
                          )}
                          {booking.mpesa_receipt_number && (
                            <p className="text-xs text-muted-foreground">
                              Receipt:{" "}
                              <span className="font-mono text-foreground">
                                {booking.mpesa_receipt_number}
                              </span>
                            </p>
                          )}
                          {booking.payment_failure_reason && (
                            <p className="flex items-start gap-1.5 text-xs text-destructive">
                              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              {booking.payment_failure_reason}
                            </p>
                          )}
                          {booking.additional_fee_amount != null && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Receipt className="h-3.5 w-3.5" />
                              Additional fee: KSh{" "}
                              {booking.additional_fee_amount.toLocaleString("en-KE")}
                              {booking.additional_fee_status
                                ? ` (${booking.additional_fee_status})`
                                : ""}
                            </p>
                          )}
                        </div>
                        {booking.additional_features?.length ? (
                          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Extras
                            </h4>
                            <p className="text-sm text-foreground">
                              {booking.additional_features.join(", ")}
                            </p>
                          </div>
                        ) : null}
                        {booking.notes && (
                          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Notes
                            </h4>
                            <p className="whitespace-pre-wrap text-sm text-foreground">
                              {booking.notes}
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
          <Pagination
            page={bookingsPagination.page}
            totalPages={bookingsPagination.totalPages}
            onPageChange={bookingsPagination.setPage}
            totalItems={filteredBookings.length}
            pageSize={8}
          />
        </Card>

        <AirportPickupsSection />
        <WeddingEventsSection
          initialRequests={initialWeddingEventRequests}
          cars={cars}
          initialLoadError={weddingEventLoadError}
        />
        <AdminGallerySection initialEvents={initialGalleryEvents} />
      </main>

      <DeleteCarModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
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
    </div>
  );
}
