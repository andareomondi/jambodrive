"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DepositFundsModal } from "@/components/modals/deposit-funds-modal";
import { ManageBookingModal } from '@/components/modals/manage-booking-modal'
import { BookingSummaryModal } from '@/components/modals/booking-summary-modal'
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
} from "lucide-react";
import { EditProfileModal } from '@/components/modals/edit-profile-modal'
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-client";
import { useEffect } from 'react'
import { DatabaseService } from '@/lib/services'
import type { Booking } from '@/lib/mock-data'

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const supabase = createClient();
  const [user, setUser] = useState(null)
const [editProfileOpen, setEditProfileOpen] = useState(false)

const [profile, setProfile] = useState<any>(null)
const [bookings, setBookings] = useState<Booking[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const db = new DatabaseService(supabase)

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    const userId = session.user.id

    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      db.getUserBookings(userId),
    ])
      .then(([{ data: profileData, error }, bookingData]) => {
        if (error) {
          toast.error('Error fetching profile.')
          return
        }
        setProfile(profileData)
        setBookings(bookingData ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  })
}, [])

  const handleManageBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setManageModalOpen(true)
  }

  const handleViewBookingSummary = (booking: Booking) => {
    setSelectedBooking(booking)
    setSummaryModalOpen(true)
  }

const activeBookings = bookings.filter(
  (b) => b.status === 'confirmed' || b.status === 'pending'
)
const pastBookings = bookings.filter(
  (b) => b.status === 'completed' || b.status === 'cancelled'
)

if (loading) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

if (!profile) return null
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your bookings and account
            </p>
          </div>
          <Button
            onClick={() => setDepositModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Deposit Funds
          </Button>
        </div>

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
      {/* Profile Card */}
      <Card className="p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={profile.profile_image ?? 'https://github.com/andareomondi/jambodrive/blob/main/public/default.png'}
              alt={profile.full_name ?? 'User'}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">
              {profile.full_name}
            </h2>
            <div className="space-y-1 text-sm text-muted-foreground mt-2">
              <p>Email: {profile.email}</p>
              <p>Phone: {profile.phone}</p>
              <p>Member since: {new Date(profile.join_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-accent">
              {profile.total_bookings}
            </div>
            <p className="text-sm text-muted-foreground">Total bookings</p>
<Button
  variant="outline"
  size="sm"
  onClick={() => setEditProfileOpen(true)}
  className="gap-2"
>
  <Edit className="h-4 w-4" />
  Edit Profile
</Button>
          </div>
        </div>
      </Card>

      {/* Active Bookings Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Active Bookings
        </h2>
        {activeBookings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeBookings.map((booking) => (
              <Card
                key={booking.id}
                className="overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {booking.cars?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {booking.id}
                      </p>
                    </div>
                    <BadgeStatus status={booking.status} />
                  </div>

                  <div className="space-y-3 mb-4 pb-4 border-b border-border text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="text-muted-foreground">
                        {new Date(booking.pickup_date).toLocaleDateString()} to {new Date(booking.return_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="text-muted-foreground">
                        {booking.pickup_location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <span className="text-foreground font-medium">
                        ${booking.total_price}
                      </span>
                    </div>
                  </div>

                  {booking.insurance && (
                    <Badge variant="secondary" className="mb-4 text-xs">
                      Insurance Included
                    </Badge>
                  )}

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/cars/${booking.car_id}`}>View Car</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-accent hover:bg-accent/90" onClick={() => handleManageBooking(booking)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CarIcon}
            title="No Active Bookings"
            description="You don't have any active bookings at the moment."
            action={{ label: "Browse Cars", href: "/cars" }}
          />
        )}
      </div>

      {/* Booking History Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Booking History
        </h2>
        {pastBookings.length > 0 ? (
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <Card
                key={booking.id}
                className="p-4 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {booking.carName}
                      </h3>
                      <BadgeStatus
                        status={booking.status}
                        className="text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>
                        {new Date(booking.pickup_date).toLocaleDateString()} to {new Date(booking.return_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />${booking.totalPrice}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" onClick={() => handleViewBookingSummary(booking)}>
                  <a href="#">View Details </a>

                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No completed or cancelled bookings yet
            </p>
          </Card>
        )}
      </div>
      </div>
<EditProfileModal
  open={editProfileOpen}
  onOpenChange={setEditProfileOpen}
  profile={profile}
  onSuccess={(updated) => setProfile(updated)}
/>
    </div>
  );
}
