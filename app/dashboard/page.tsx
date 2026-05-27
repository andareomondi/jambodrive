import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatabaseService } from "@/lib/services";
import { DashboardClient } from "./dashboard-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard",
  description:
    "View and manage your car hire bookings, profile, and rental history.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // getUser() contacts the Supabase Auth server to verify the token —
  // unlike getSession() which only reads from cookies and can be spoofed.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const db = new DatabaseService(supabase);

  const [profile, bookings] = await Promise.all([
    db.getUserProfile(user.id),
    db.getUserBookings(user.id),
  ]);

  return <DashboardClient profile={profile} bookings={bookings} />;
}
