import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatabaseService } from "@/lib/services";
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Dashboard | JamboDrive",
  description:
    "Manage your premium active rentals, payment history, and profile settings.",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch session directly on the server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Instant server-side protection
  if (!user || error) {
    redirect("/auth/login");
  }

  const db = new DatabaseService(supabase);
  let profile = null;
  let bookings = [];

  try {
    // Parallel fetch profile and bookings on the server side
    const [profileData, bookingsData] = await Promise.all([
      db.getUserProfile(user.id),
      db.getUserBookings(user.id),
    ]);
    profile = profileData;
    bookings = bookingsData;
  } catch (err) {
    console.error("Error fetching dashboard payload:", err);
  }

  // Pass server data cleanly down into a client bundle that opens modals/interacts
  return (
    <DashboardClientWrapper
      user={user}
      initialProfile={profile}
      initialBookings={bookings}
    />
  );
}
