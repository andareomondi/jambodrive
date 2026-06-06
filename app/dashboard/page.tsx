import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/services/profile";
import { getUserBookings } from "@/lib/services/bookings";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { AuthGuard } from "@/components/auth/auth-guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard",
  description:
    "View and manage your car hire bookings, profile, and rental history.",
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

  const [profile, bookings] = await Promise.all([
    getProfileById(user.id),
    getUserBookings(user.id),
  ]);

  return (
    <>
      <AuthGuard />
      <DashboardClient profile={profile} bookings={bookings} />
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
