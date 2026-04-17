"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { DepositFundsModal } from "@/components/modals/deposit-funds-modal";
import { ManageBookingModal } from "@/components/modals/manage-booking-modal";
import { BookingSummaryModal } from "@/components/modals/booking-summary-modal";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeStatus } from "@/components/common/badge-status";
import { EmptyState } from "@/components/common/empty-state";
import {
  Calendar,
  MapPin,
  DollarSign,
  Car as CarIcon,
  Plus,
  Edit,
  ChevronRight,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { DatabaseService } from "@/lib/services";
import type { Booking } from "@/lib/mock-data";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Modal States
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    const db = new DatabaseService(supabase);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const userId = session.user.id;

      Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        db.getUserBookings(userId),
      ])
        .then(([{ data: profileData, error }, bookingData]) => {
          if (error) {
            toast.error("Error fetching profile.");
            return;
          }
          setProfile(profileData);
          setBookings(bookingData ?? []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    });
  }, [router, supabase]);

  const handleManageBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setManageModalOpen(true);
  };

  const handleViewBookingSummary = (booking: Booking) => {
    setSelectedBooking(booking);
    setSummaryModalOpen(true);
  };

  const activeBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-background">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Welcome back, {profile.full_name?.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Here is an overview of your account and rentals.
            </p>
          </div>
          <Button
            onClick={() => setDepositModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm rounded-full px-6 transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" />
            Deposit Funds
          </Button>
        </div>

        {/* PROFILE OVERVIEW - Streamlined layout */}
        <Card className="p-1 border-none shadow-sm bg-white dark:bg-card overflow-hidden rounded-2xl">
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative">
            <div className="relative w-28 h-28 rounded-full ring-4 ring-slate-50 dark:ring-slate-900 overflow-hidden flex-shrink-0 shadow-sm">
              <Image
                src={
                  profile.profile_image ??
                  "https://github.com/andareomondi/jambodrive/blob/main/public/default.png?raw=true"
                }
                alt={profile.full_name ?? "User"}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {profile.full_name}
              </h2>
              <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-sm text-muted-foreground">
                <span className="flex items-center justify-center md:justify-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {profile.email}
                </span>
                <span className="flex items-center justify-center md:justify-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {profile.phone || "No phone added"}
                </span>
              </div>
              
              <div className="mt-6 flex justify-center md:justify-start">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditProfileOpen(true)}
                  className="rounded-full text-xs font-medium px-4"
                >
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            <div className="text-center md:flex flex-col items-end justify-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl min-w-[200px]">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Bookings</p>
              <div className="text-4xl font-bold text-accent">
                {profile.total_bookings || bookings.length}
              </div>
            </div>
          </div>
        </Card>

        {/* ACTIVE BOOKINGS SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-accent rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">Active Rentals</h2>
          </div>
          
          {activeBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="flex flex-col overflow-hidden border-slate-200/60 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/30 rounded-2xl"
                >
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="font-semibold text-xl text-foreground mb-1">
                          {booking.cars?.name || "Vehicle"}
                        </h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                          Ref: {booking.id.split('-')[0]}
                        </p>
                      </div>
                      <BadgeStatus status={booking.status} />
                    </div>

                    <div className="space-y-4 mb-6 text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-foreground font-medium">
                          {new Date(booking.pickup_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })} 
                          {" - "} 
                          {new Date(booking.return_date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {booking.pickup_location}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-foreground font-semibold">
                          ${booking.total_price}
                        </span>
                      </div>
                    </div>

                    {booking.insurance && (
                      <Badge variant="outline" className="mb-4 text-xs font-normal border-green-200 text-green-700 bg-green-50 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/50">
                        Insurance Included
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 rounded-xl bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Link href={`/cars/${booking.car_id}`}>View Car</Link>
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black"
                      onClick={() => handleManageBooking(booking)}
                    >
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CarIcon}
              title="No active trips"
              description="You don't have any cars currently booked or pending."
              action={{ label: "Browse Available Cars", href: "/cars" }}
            />
          )}
        </section>

        {/* BOOKING HISTORY SECTION - Unified Card Layout */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">Booking History</h2>
          </div>

          {pastBookings.length > 0 ? (
            <Card className="overflow-hidden shadow-sm rounded-2xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-card">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pastBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center flex-shrink-0 text-slate-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-foreground text-lg">
                            {booking.cars?.name || "Vehicle"}
                          </h3>
                          <BadgeStatus status={booking.status} className="scale-90 origin-left" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(booking.pickup_date).toLocaleDateString()} - {new Date(booking.return_date).toLocaleDateString()}
                          </span>
                          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                          <span className="font-medium text-foreground">
                            Ksh {booking.total_price}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto text-accent hover:text-accent hover:bg-accent/10 rounded-lg group-hover:translate-x-1 transition-transform"
                      onClick={() => handleViewBookingSummary(booking)}
                    >
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
              <p className="text-muted-foreground">
                Your past trips will appear here.
              </p>
            </Card>
          )}
        </section>
      </main>

      {/* Modals */}
      <DepositFundsModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
      />
      <ManageBookingModal
        open={manageModalOpen}
        onOpenChange={setManageModalOpen}
        booking={selectedBooking}
      />
      <BookingSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        booking={selectedBooking}
      />
      <EditProfileModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={profile}
        onSuccess={(updated) => setProfile(updated)}
      />
    </div>
  );
}
