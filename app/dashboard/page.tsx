"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DepositFundsModal } from "@/components/modals/deposit-funds-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeStatus } from "@/components/common/badge-status";
import { EmptyState } from "@/components/common/empty-state";
import { mockUsers, mockBookings } from "@/lib/mock-data";
import {
  LogOut,
  Settings,
  Calendar,
  MapPin,
  DollarSign,
  Car as CarIcon,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  // Mock current user - user U001
  const currentUser = mockUsers[0];

  // Get bookings for current user
  const userBookings = mockBookings.filter((b) => b.userId === currentUser.id);
  const activeBookings = userBookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  );
  const pastBookings = userBookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled",
  );

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Logged out successfully");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Deposit Modal */}
        <DepositFundsModal
          open={depositModalOpen}
          onOpenChange={setDepositModalOpen}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="#" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

      {/* Profile Card */}
      <Card className="p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={currentUser.profileImage}
              alt={currentUser.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">
              {currentUser.name}
            </h2>
            <div className="space-y-1 text-sm text-muted-foreground mt-2">
              <p>Email: {currentUser.email}</p>
              <p>Phone: {currentUser.phone}</p>
              <p>Member since: {currentUser.joinDate}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-accent">
              {currentUser.totalBookings}
            </div>
            <p className="text-sm text-muted-foreground">Total bookings</p>
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
                        {booking.carName}
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
                        {booking.pickupDate} to {booking.returnDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="text-muted-foreground">
                        {booking.pickupLocation}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <span className="text-foreground font-medium">
                        ${booking.totalPrice}
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
                      <Link href={`/cars/${booking.carId}`}>View Car</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-accent hover:bg-accent/90"
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
                        {booking.pickupDate} to {booking.returnDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />${booking.totalPrice}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cars/${booking.carId}`}>View Details</Link>
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
    </div>
  );
}
