import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/services/profile";
import {
  getUserAirportPickups,
  getUserBookings,
} from "@/lib/services/bookings";
import { getUserWeddingEventRequests } from "@/lib/actions/wedding-events";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { AuthGuard } from "@/components/auth/auth-guard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Dashboard",
  description:
    "Manage your profile, car hire bookings, airport pickups, and wedding transport enquiries.",
  robots: { index: false, follow: false },
};

async function DashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const [profile, bookings, airportPickups, weddingEventResult] =
    await Promise.all([
      getProfileById(user.id),
      getUserBookings(user.id),
      getUserAirportPickups(user.id),
      getUserWeddingEventRequests(user.id).then(
        (requests) => ({ requests, error: false as const }),
        (loadError: unknown) => {
          console.error(
            "[DashboardPage] could not load wedding event enquiries:",
            loadError,
          );
          return { requests: [], error: true as const };
        },
      ),
    ]);

  return (
    <>
      <AuthGuard />
      <DashboardClient
        profile={profile}
        bookings={bookings}
        airportPickups={airportPickups}
        weddingEventRequests={weddingEventResult.requests}
        weddingEventLoadError={
          weddingEventResult.error
            ? "Wedding enquiries could not be loaded. Please try again later."
            : undefined
        }
      />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
