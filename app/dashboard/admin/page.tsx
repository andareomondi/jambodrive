import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatabaseService } from "@/lib/services";
import { AdminDashboardClient } from "./admin-dashboard-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage fleet, users, and bookings for Cosmara Car Hire.",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Role check server-side — no client-side flash
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileData?.role !== "admin") {
    redirect("/");
  }

  const db = new DatabaseService(supabase);

  const [cars, bookings, users] = await Promise.all([
    db.getCars(),
    db.getBookings(),
    db.getProfiles(),
  ]);

  return (
    <AdminDashboardClient
      initialCars={cars}
      initialBookings={bookings}
      initialUsers={users}
    />
  );
}
