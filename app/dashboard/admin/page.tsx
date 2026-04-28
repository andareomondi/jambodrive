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
import { createClient } from "@/lib/supabase/client";
import { DatabaseService } from "@/lib/services";
import { useAuth } from "@/components/auth/auth-context";
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

export default function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const supabase = useMemo(() => createClient(), []);
  const db = useMemo(() => new DatabaseService(supabase), [supabase]);

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

  const revenueStatuses = ["confirmed", "completed"];

  useEffect(() => {
    if (!isAdmin) return;
    db.getCars().then(setCars).catch(console.error);
    db.getBookings().then(setBookings).catch(console.error);
    db.getProfiles().then(setUsers).catch(console.error);
  }, [isAdmin]);

  const totalCars = cars.length;
  const totalBookings = bookings.length;
  const totalUsers = users.filter((u) => u.role === "customer").length;
  const totalRevenue = bookings
    .filter((b) => revenueStatuses.includes(b.status))
    .reduce((sum, b) => sum + b.total_price, 0);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.car?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.profiles?.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const refreshCars = () => db.getCars().then(setCars).catch(console.error);

  const handleBookingStatus = async (
    id: string,
    status: "confirmed" | "cancelled",
  ) => {
    const { data: bookingData, error: bookingError } = await supabase
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
      const { error: carError } = await supabase
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

  const handleRoleChange = async (userId: string, role: string) => {
    const { error } = await supabase
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
      `https://wa.me/${cleaned}?text=${encodeURIComponent("Hello, this is the admin from Cozy Mobility Tours.")}`,
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
    <div className="flex h-screen bg-slate-50 dark:bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 overflow-auto">
          <main className="p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* HEADER */}
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

              {/* STATS */}
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

              {/* BOOKINGS */}
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
                    <div className="relative min-w-[140px]">
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
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <TableRow
                            key={booking.id}
                            className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50"
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
                              {new Date(booking.pickup_date).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}{" "}
                              -{" "}
                              {new Date(booking.return_date).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground whitespace-nowrap">
                              Ksh {booking.total_price}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <BadgeStatus status={booking.status} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap pr-6">
                              <div className="flex gap-2">
                                {booking.status === "pending" ? (
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
                                ) : booking.status === "confirmed" ? (
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
                                ) : (
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
              </Card>

              {/* USERS */}
              <Card className="p-4 sm:p-6 shadow-sm border-none bg-white dark:bg-card rounded-2xl">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  User Directory
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {users.map((u) => (
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
              </Card>

              {/* FLEET */}
              <Card className="p-4 sm:p-6 shadow-sm border-none bg-white dark:bg-card rounded-2xl">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cars.slice(0, 6).map((car) => (
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
                            ${car.price}
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
                      </div>
                    </div>
                  ))}
                </div>
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
          db.getBookings().then(setBookings);
        }}
      />
    </div>
  );
}
