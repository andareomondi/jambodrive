import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCars } from "@/lib/services/cars";
import { getBookings } from "@/lib/services/bookings";
import { getProfiles } from "@/lib/services/profile";
import { getGalleryEvents } from "@/lib/services/gallery";
import { getAdminWeddingEventRequests } from "@/lib/actions/wedding-events";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { AuthGuard } from "@/components/auth/auth-guard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage fleet, users, and bookings for Cosmara Car Hire.",
  robots: { index: false, follow: false },
};

async function AdminContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/auth/login");

  // Role check server-side — no client-side flash
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Schema uses "super_admin" not "admin"
  if (profileData?.role !== "super_admin") redirect("/");

  const [
    cars,
    bookings,
    profiles,
    galleryEvents,
    weddingEventRequests,
  ] = await Promise.all([
    getCars(),
    getBookings(),
    getProfiles(),
    getGalleryEvents().catch(() => []),
    getAdminWeddingEventRequests().catch((loadError: unknown) => {
      console.error(
        "[AdminPage] could not load wedding event enquiries:",
        loadError,
      );
      return null;
    }),
  ]);

  return (
    <>
      <AuthGuard />
      <AdminDashboardClient
        initialCars={cars}
        initialBookings={bookings}
        initialProfiles={profiles}
        initialGalleryEvents={galleryEvents}
        initialWeddingEventRequests={weddingEventRequests ?? []}
        weddingEventLoadError={
          weddingEventRequests === null
            ? "Wedding enquiries could not be loaded. Confirm wedding_events.sql has been run in Supabase, then refresh."
            : undefined
        }
      />
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
