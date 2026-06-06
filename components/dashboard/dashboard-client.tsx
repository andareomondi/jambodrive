"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { DepositFundsModal } from "@/components/modals/deposit-funds-modal";
import { ManageBookingModal } from "@/components/modals/manage-booking-modal";
import { BookingSummaryModal } from "@/components/modals/booking-summary-modal";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Banknote,
  Car as CarIcon,
  Plus,
  Edit,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import type { Booking, Profile } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardClientProps {
  profile: Profile;
  bookings: Booking[];
}


const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary text-primary-foreground",
  pending:   "bg-muted text-muted-foreground border border-border",
  completed: "bg-accent text-accent-foreground",
  cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
  failed:    "bg-destructive/20 text-destructive-foreground border border-destructive/30", // Added
};

function formatDateRange(pickup: string, returnDate: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: "numeric" };
  return `${new Date(pickup).toLocaleDateString("en-KE", opts)} → ${new Date(returnDate).toLocaleDateString("en-KE", yearOpts)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-KE", {
    month: "short", day: "numeric", year: "numeric",
  });
}


function SectionHeading({ label, accent = true }: { label: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`h-8 w-1 rounded-full ${accent ? "bg-accent" : "bg-border"}`} />
      <h2 className="text-2xl font-bold text-foreground">{label}</h2>
    </div>
  );
}

function ActiveBookingCard({
  booking,
  onManage,
}: {
  booking: Booking;
  onManage: () => void;
}) {
  const status = booking.status ?? "pending";
  return (
    <Card className="flex flex-col overflow-hidden border-border shadow-sm hover:shadow-md hover:border-accent/40 transition-all duration-200 rounded-2xl">
      <div className="p-6 flex-1 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-xl text-foreground leading-tight">
              {booking.cars?.name ?? "Vehicle"}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
              Ref: {booking.id.split("-")[0]}
            </p>
          </div>
          <Badge className={`capitalize text-xs ${STATUS_STYLES[status]}`}>
            {status}
          </Badge>
        </div>

        {/* Details block */}
        <div className="space-y-3 text-sm bg-muted/40 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-accent shrink-0" />
            <span className="text-foreground font-medium">
              {formatDateRange(booking.pickup_date, booking.return_date)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-accent shrink-0" />
            <span className="text-muted-foreground truncate">
              {booking.pickup_location}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground truncate">
              {booking.return_location}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Banknote className="w-4 h-4 text-accent shrink-0" />
            <span className="text-foreground font-semibold">
              Ksh {booking.total_price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border bg-muted/20 flex gap-3">
        <Button asChild variant="outline" className="flex-1 rounded-xl">
          <Link href={`/cars/${booking.car_id}`}>View Car</Link>
        </Button>
        <Button
          className="flex-1 rounded-xl bg-foreground text-background hover:bg-foreground/90"
          onClick={onManage}
        >
          Manage
        </Button>
      </div>
    </Card>
  );
}

function PastBookingRow({
  booking,
  onView,
}: {
  booking: Booking;
  onView: () => void;
}) {
  const status = booking.status ?? "completed";
  return (
    <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors group">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="hidden sm:flex w-10 h-10 rounded-full bg-muted items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground">
              {booking.cars?.name ?? "Vehicle"}
            </h3>
            <Badge className={`capitalize text-xs ${STATUS_STYLES[status]}`}>
              {status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}
            </span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="font-medium text-foreground">
              Ksh {booking.total_price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full sm:w-auto text-accent hover:text-accent hover:bg-accent/10 rounded-lg group-hover:translate-x-0.5 transition-transform"
        onClick={onView}
      >
        View Details <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DashboardClient({ profile, bookings: initialBookings }: DashboardClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [depositModalOpen, setDepositModalOpen]   = useState(false);
  const [manageModalOpen, setManageModalOpen]     = useState(false);
  const [summaryModalOpen, setSummaryModalOpen]   = useState(false);
  const [editProfileOpen, setEditProfileOpen]     = useState(false);

  // Memoised — only recalculates when bookings changes
  const { activeBookings, pastBookings } = useMemo(() => ({
    activeBookings: bookings.filter((b) => b.status === "confirmed" || b.status === "pending"),
    pastBookings:   bookings.filter((b) => b.status === "completed"  || b.status === "cancelled"),
    failedBookingCount: bookings.filter((b) => b.status === "failed").length,
  }), [bookings]);

  const openManage = (booking: Booking) => {
    setSelectedBooking(booking);
    setManageModalOpen(true);
  };

  const openSummary = (booking: Booking) => {
    setSelectedBooking(booking);
    setSummaryModalOpen(true);
  };

  // Called when ManageBookingModal cancels a booking — updates local state
  const handleBookingUpdated = (updated: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    // Reflect updated total_bookings count if cancelled
    if (updated.status === "cancelled") {
      setCurrentProfile((p) => ({
        ...p,
        total_bookings: Math.max(0, (p.total_bookings ?? 1) - 1),
      }));
    }
  };

  const firstName = currentProfile.full_name?.split(" ")[0] ?? "there";
  const totalBookings = currentProfile.total_bookings ?? bookings.length;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Page header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Here is an overview of your account and rentals.
            </p>
          </div>
          {/* Deposit — hidden until payment logic is wired */}
          <Button
            onClick={() => setDepositModalOpen(true)}
            className="hidden bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Deposit Funds
          </Button>
        </div>

        {/* ── Profile card ── */}
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">

            {/* Avatar */}
            <div className="relative w-24 h-24 rounded-full ring-2 ring-border overflow-hidden shrink-0">
              {currentProfile.profile_image ? (
                <Image
                  src={currentProfile.profile_image}
                  alt={currentProfile.full_name ?? "User avatar"}
                  fill
                  sizes="96px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <User className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {currentProfile.full_name ?? "—"}
              </h2>
              <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm text-muted-foreground">
                <span>{currentProfile.email ?? "No email"}</span>
                <span>{currentProfile.phone ?? "No phone added"}</span>
              </div>
              <div className="pt-2 flex justify-center md:justify-start">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditProfileOpen(true)}
                  className="rounded-full text-xs font-medium px-4"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Bookings count */}
            <div className="flex flex-col items-center justify-center bg-muted/50 border border-border p-6 rounded-xl min-w-[160px] text-center shrink-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Total Bookings
              </p>
              <span className="text-4xl font-bold text-accent">{totalBookings}</span>
            </div>
          </div>
        </Card>

        {/* ── Active rentals ── */}
        <section>
          <SectionHeading label="Active Rentals" accent />
          {activeBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeBookings.map((booking) => (
                <ActiveBookingCard
                  key={booking.id}
                  booking={booking}
                  onManage={() => openManage(booking)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed rounded-2xl">
              <CarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="font-semibold text-foreground mb-1">No active trips</p>
              <p className="text-sm text-muted-foreground mb-6">
                You don&apos;t have any cars currently booked or pending.
              </p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6">
                <Link href="/cars">Browse Available Cars</Link>
              </Button>
            </Card>
          )}
        </section>

        {/* ── Booking history ── */}
        <section>
          <SectionHeading label="Booking History" accent={false} />
          {pastBookings.length > 0 ? (
            <Card className="overflow-hidden shadow-sm rounded-2xl border-border">
              <div className="divide-y divide-border">
                {pastBookings.map((booking) => (
                  <PastBookingRow
                    key={booking.id}
                    booking={booking}
                    onView={() => openSummary(booking)}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-dashed rounded-2xl">
              <p className="text-muted-foreground text-sm">
                Your past trips will appear here.
              </p>
            </Card>
          )}
        </section>
      </main>

      {/* ── Modals ── */}
      <DepositFundsModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
      />
      <ManageBookingModal
        open={manageModalOpen}
        onOpenChange={setManageModalOpen}
        booking={selectedBooking}
        onSuccess={handleBookingUpdated}
      />
      <BookingSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        booking={selectedBooking}
      />
      <EditProfileModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={currentProfile}
        onSuccess={(updated) => setCurrentProfile(updated)}
      />
    </div>
  );
}
