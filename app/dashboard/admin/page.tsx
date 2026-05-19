"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeStatus } from "@/components/common/badge-status";
import { CarModal } from "@/components/modals/car-modal";
import { BookingModal } from "@/components/modals/BookingModal";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/auth/supabase-provider";
import { DatabaseService } from "@/lib/services";
import type { Car, Booking, User } from "@/lib/mock-data";
import {
  Users,
  DollarSign,
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
  ArrowRight,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteCarModal } from "@/components/modals/delete-car-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
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
  const getPages = () => {
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
    return pages;
  };
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
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
        {getPages().map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-muted-foreground text-sm"
            >
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

const BOOKINGS_PAGE_SIZE = 8;
const USERS_PAGE_SIZE = 6;
const FLEET_PAGE_SIZE = 6;

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const supabase = useSupabase();
  const db = new DatabaseService(supabase.supabase);
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Only confirmed + completed count as earned revenue.
  // Pending and failed are excluded — pending may still cancel, failed never completed.
  const revenueStatuses = ["confirmed", "completed"];

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setIsAdmin(false);
        setAuthLoading(false);
        setDataLoading(false);
        return;
      }
      const { data } = await supabase.supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      const admin = data?.role === "admin";
      setIsAdmin(admin);
      setAuthLoading(false);
      if (!admin) {
        setDataLoading(false);
        return;
      }
      Promise.all([db.getCars(), db.getBookings(), db.getProfiles()])
        .then(([carsData, bookingsData, usersData]) => {
          setCars(carsData);
          setBookings(bookingsData);
          setUsers(usersData);
        })
        .catch(console.error)
        .finally(() => setDataLoading(false));
    });
    return () => subscription.unsubscribe();
  }, []);

  const totalCars = cars.length;
  const totalBookings = bookings.length;
  const totalUsers = users.filter((u) => u.role === "customer").length;
  const totalRevenue = bookings
    .filter((b) => revenueStatuses.includes(b.status))
    .reduce((sum, b) => sum + b.total_price, 0);

  // ── Failed bookings count for the stats strip ─────────────────────────────
  const totalFailed = bookings.filter((b) => b.status === "failed").length;

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchesSearch =
          booking.cars?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.profiles?.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [bookings, searchQuery, statusFilter],
  );

  const bookingsPagination = usePagination(
    filteredBookings,
    BOOKINGS_PAGE_SIZE,
  );
  const usersPagination = usePagination(users, USERS_PAGE_SIZE);
  const fleetPagination = usePagination(cars, FLEET_PAGE_SIZE);

  const refreshCars = () => db.getCars().then(setCars).catch(console.error);
  const refreshBookings = () =>
    db.getBookings().then(setBookings).catch(console.error);

  const handleBookingStatus = async (
    id: string,
    status: "confirmed" | "cancelled",
  ) => {
    const { data: bookingData, error: bookingError } = await supabase.supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select("car_id")
      .single();
    if (bookingError) {
      toast.error(bookingError.message);
      return;
    }
    if (status === "confirmed" && bookingData?.car_id) {
      const { error: carError } = await supabase.supabase
        .from("cars")
        .update({ available: false })
        .eq("id", bookingData.car_id);
      if (carError) {
        toast.error(
          "Booking confirmed, but failed to update car availability.",
        );
      } else {
        setCars((prev) =>
          prev.map((c) =>
            c.id === bookingData.car_id ? { ...c, available: false } : c,
          ),
        );
      }
    }
    toast.success(
      `Booking ${status === "confirmed" ? "confirmed" : "rejected"}.`,
    );
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b)),
    );
  };

  // Dismiss a failed booking by marking it cancelled so it stops
  // cluttering the pending/active views. The M-Pesa receipt was never
  // issued so no refund logic is needed.
  const handleDismissFailed = async (id: string) => {
    const { error } = await supabase.supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Failed booking dismissed.");
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    );
  };

  const handleRoleChange = async (userId: string, role: string) => {
    const { error } = await supabase.supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role updated.");
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  };

  const initiateWhatsApp = (phoneNumber: string, bookingDetails: any) => {
    let formatted = phoneNumber.replace(/\D/g, "");
    if (formatted.startsWith("0")) formatted = "254" + formatted.substring(1);
    else if (formatted.startsWith("7")) formatted = "254" + formatted;
    const message = encodeURIComponent(
      `Hello, We have received your booking and confirmed it.\n\n*Booking Details:*\n🚗 Vehicle: ${bookingDetails.car_name}\n📅 Pickup: ${new Date(bookingDetails.pickup_date).toLocaleDateString()}\n📍 Location: ${bookingDetails.pickup_location}\n💰 Total: KES ${bookingDetails.total_price}\n\nPlease let us know if you have any questions!`,
    );
    window.open(`https://wa.me/${formatted}?text=${message}`, "_blank");
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "254" + cleaned.substring(1);
    else if (cleaned.startsWith("7")) cleaned = "254" + cleaned;
    window.open(
      `https://wa.me/${cleaned}?text=${encodeURIComponent("Hello, this is the admin from Cosmara.")}`,
      "_blank",
    );
  };

  const handleAddCar = () => {
    setSelectedCar(null);
    setCarModalOpen(true);
  };
  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setCarModalOpen(true);
  };
  const openDeleteConfirm = (car: Car) => {
    setCarToDelete(car);
    setDeleteModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Access Denied
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            You do not have permission to view this page.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-background">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 overflow-auto">
            <main className="p-4 sm:p-6 md:p-8">
              <div className="max-w-7xl mx-auto space-y-8">
                {/* ── HEADER ─────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Super Admin
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                      Manage your fleet, users, and bookings.
                    </p>
                  </div>
                </div>

                {/* ── STATS ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    {
                      icon: Calendar,
                      label: "Bookings",
                      value: totalBookings,
                      color: "text-blue-500",
                      bg: "bg-blue-50 dark:bg-blue-500/10",
                    },
                    {
                      icon: DollarSign,
                      label: "Revenue Collected",
                      value: `Ksh ${totalRevenue.toLocaleString()}`,
                      color: "text-green-500",
                      bg: "bg-green-50 dark:bg-green-500/10",
                    },
                    {
                      icon: CarIcon,
                      label: "Fleet",
                      value: totalCars,
                      color: "text-purple-500",
                      bg: "bg-purple-50 dark:bg-purple-500/10",
                    },
                    {
                      icon: Users,
                      label: "Customers",
                      value: totalUsers,
                      color: "text-orange-500",
                      bg: "bg-orange-50 dark:bg-orange-500/10",
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <Card
                        key={i}
                        className="p-4 sm:p-6 shadow-sm border-none bg-white dark:bg-card rounded-2xl"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                              {stat.label}
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-foreground">
                              {stat.value}
                            </p>
                          </div>
                          <div
                            className={`p-2 sm:p-3 rounded-full ${stat.bg} hidden sm:flex`}
                          >
                            <Icon
                              className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`}
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* ── FAILED PAYMENTS ALERT BANNER ───────────────────── */}
                {totalFailed > 0 && (
                  <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-destructive/5 border border-destructive/20 text-destructive">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                      {totalFailed} booking{totalFailed > 1 ? "s" : ""} failed
                      payment.{" "}
                      <button
                        className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                        onClick={() => setStatusFilter("failed")}
                      >
                        Filter to view
                      </button>
                    </p>
                  </div>
                )}

                {/* ── BOOKINGS ───────────────────────────────────────── */}
                <Card className="shadow-sm border-none bg-white dark:bg-card rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search ID, customer, or car..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl h-11"
                        />
                      </div>
                      <div className="relative min-w-[160px]">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 h-11 border-none rounded-xl bg-slate-50 dark:bg-slate-900/50 text-foreground text-sm focus:ring-2 focus:ring-accent/50 appearance-none cursor-pointer"
                        >
                          <option value="">All Statuses</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          {/* ↓ new */}
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-900/20">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="font-semibold whitespace-nowrap pl-6">
                            ID
                          </TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">
                            Vehicle
                          </TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">
                            Customer
                          </TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">
                            Dates
                          </TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">
                            Amount
                          </TableHead>
                          <TableHead className="font-semibold whitespace-nowrap">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold whitespace-nowrap pr-6">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookingsPagination.paged.length > 0 ? (
                          bookingsPagination.paged.map((booking) => (
                            <TableRow
                              key={booking.id}
                              className={`border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                                booking.status === "failed"
                                  ? "bg-destructive/5 dark:bg-destructive/10"
                                  : ""
                              }`}
                            >
                              <TableCell className="font-medium text-foreground whitespace-nowrap pl-6">
                                #{booking.id.slice(0, 6).toUpperCase()}
                              </TableCell>
                              <TableCell className="text-foreground whitespace-nowrap">
                                {booking.cars?.name}
                              </TableCell>
                              <TableCell className="text-foreground whitespace-nowrap">
                                {booking.profiles?.full_name}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(
                                  booking.pickup_date,
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                -{" "}
                                {new Date(
                                  booking.return_date,
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="font-semibold text-foreground whitespace-nowrap">
                                Ksh {booking.total_price.toLocaleString()}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <BadgeStatus status={booking.status} />
                              </TableCell>

                              {/* ── Actions cell ── */}
                              <TableCell className="whitespace-nowrap pr-6">
                                <div className="flex gap-2 items-center">
                                  {booking.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3 rounded-lg"
                                        onClick={() =>
                                          handleBookingStatus(
                                            booking.id,
                                            "confirmed",
                                          )
                                        }
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 h-8 px-3 rounded-lg"
                                        onClick={() =>
                                          handleBookingStatus(
                                            booking.id,
                                            "cancelled",
                                          )
                                        }
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}

                                  {booking.status === "confirmed" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2"
                                      onClick={() => {
                                        const car = cars.find(
                                          (c) => c.id === booking.car_id,
                                        );
                                        const phone = booking.profiles?.phone;
                                        if (!phone) {
                                          toast.error(
                                            "No phone number for this customer.",
                                          );
                                          return;
                                        }
                                        initiateWhatsApp(phone, {
                                          car_name: `${car?.name} ${car?.model}`,
                                          pickup_date: booking.pickup_date,
                                          pickup_location:
                                            booking.pickup_location,
                                          total_price: booking.total_price,
                                        });
                                      }}
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />{" "}
                                      Initiate
                                    </Button>
                                  )}

                                  {/* ── Failed state: show reason + dismiss action ── */}
                                  {booking.status === "failed" && (
                                    <>
                                      {/* Reason tooltip */}
                                      {(booking as any)
                                        .payment_failure_reason && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 text-xs text-destructive cursor-default">
                                              <AlertCircle className="h-3.5 w-3.5" />
                                              Why?
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="max-w-[220px] text-center"
                                          >
                                            {
                                              (booking as any)
                                                .payment_failure_reason
                                            }
                                          </TooltipContent>
                                        </Tooltip>
                                      )}

                                      {/* Dismiss → marks as cancelled, removes from failed view */}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 h-8 px-3 rounded-lg gap-1.5"
                                            onClick={() =>
                                              handleDismissFailed(booking.id)
                                            }
                                          >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Dismiss
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          Mark as cancelled and remove from
                                          failed list
                                        </TooltipContent>
                                      </Tooltip>
                                    </>
                                  )}

                                  {/* Completed / cancelled — no further action */}
                                  {(booking.status === "completed" ||
                                    booking.status === "cancelled") && (
                                    <span className="text-xs text-muted-foreground px-2">
                                      Processed
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-12 text-muted-foreground"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <Search className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                                <p>No bookings found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Pagination
                    page={bookingsPagination.page}
                    totalPages={bookingsPagination.totalPages}
                    onPageChange={bookingsPagination.setPage}
                    totalItems={filteredBookings.length}
                    pageSize={BOOKINGS_PAGE_SIZE}
                  />
                </Card>

                {/* ── USERS ──────────────────────────────────────────── */}
                <Card className="shadow-sm border-none bg-white dark:bg-card rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-foreground">
                      User Directory
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {usersPagination.paged.map((u) => (
                        <div
                          key={u.id}
                          className="group border border-slate-100 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:shadow-md hover:border-accent/30 bg-slate-50/50 dark:bg-slate-900/20"
                        >
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                              {u.profile_image ? (
                                <Image
                                  src={u.profile_image}
                                  alt={u.full_name ?? ""}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Users className="h-6 w-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {u.full_name}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {u.email}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase tracking-wider font-semibold bg-white dark:bg-slate-900"
                                >
                                  {u.role?.replace(/_/g, " ")}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {u.total_bookings} trips
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
                            <Button
                              size="sm"
                              className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2 rounded-xl"
                              onClick={() => handleWhatsApp(u.phone ?? "")}
                            >
                              <MessageCircle className="h-4 w-4" /> Message
                            </Button>
                            <select
                              value={u.role ?? "customer"}
                              onChange={(e) =>
                                handleRoleChange(u.id, e.target.value)
                              }
                              className="flex-1 sm:flex-none text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-foreground focus:ring-2 focus:ring-accent/50 cursor-pointer"
                            >
                              <option value="customer">Customer</option>
                              <option value="facilitator">Facilitator</option>
                              <option value="admin">Super Admin</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Pagination
                    page={usersPagination.page}
                    totalPages={usersPagination.totalPages}
                    onPageChange={usersPagination.setPage}
                    totalItems={users.length}
                    pageSize={USERS_PAGE_SIZE}
                  />
                </Card>

                {/* ── FLEET ──────────────────────────────────────────── */}
                <Card className="shadow-sm border-none bg-white dark:bg-card rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <h2 className="text-xl font-bold text-foreground">
                        Fleet Management
                      </h2>
                      <Button
                        onClick={handleAddCar}
                        className="w-full sm:w-auto bg-accent hover:bg-accent/90 rounded-xl"
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
                          className="group rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                          <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                            <img
                              src={car.image}
                              alt={car.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-3 right-3">
                              <Badge
                                className={`${car.available ? "bg-white/90 text-black" : "bg-black/80 text-white"} backdrop-blur-sm border-none shadow-sm`}
                              >
                                {car.available ? "Available" : "Rented"}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-lg text-foreground leading-tight">
                                  {car.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {car.model}
                                </p>
                              </div>
                              <p className="font-bold text-accent">
                                Ksh {car.price}
                                <span className="text-xs text-muted-foreground font-normal">
                                  /d
                                </span>
                              </p>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent"
                                onClick={() => handleEditCar(car)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-transparent"
                                onClick={() => openDeleteConfirm(car)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                              </Button>
                            </div>
                            <hr />
                            <div className="mt-4">
                              <Link
                                href={`/cars/${car.id}`}
                                className="text-sm text-accent hover:underline flex items-center gap-1"
                              >
                                View Details{" "}
                                <ArrowRight className="h-3.5 w-3.5" />
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
              </div>
            </main>
          </div>
        </div>

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
            ...(carToDelete?.images || []),
          ]}
        />
        <CarModal
          open={carModalOpen}
          onOpenChange={setCarModalOpen}
          car={selectedCar}
          onSuccess={refreshCars}
        />
        <BookingModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          onSuccess={() => {
            refreshCars();
            refreshBookings();
          }}
        />
      </div>
    </TooltipProvider>
  );
}
