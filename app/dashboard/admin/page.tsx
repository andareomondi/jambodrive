import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"; // Adjust based on your exact SSR auth package
import { cookies } from "next/headers";
import { AdminClientWrapper } from "./admin-client-wrapper";
import { DatabaseService } from "@/lib/services";

// SEO Metadata Configuration
export const metadata: Metadata = {
  title: "Super Admin Dashboard | Cozy Mobility Tours",
  description:
    "Secure administrative fleet control, booking updates, management profiles, and transaction analytics.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Verify authenticated session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Authorize Admin Role on Server
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/unauthorized"); // Safe server-side boundary redirect
  }

  // Fetch initial data concurrently on the server
  const db = new DatabaseService(supabase);
  const [initialCars, initialBookings, initialProfiles] = await Promise.all([
    db.getCars(),
    db.getBookings(),
    db.getProfiles(),
  ]);

  return (
    <AdminClientWrapper
      user={session.user}
      initialCars={initialCars || []}
      initialBookings={initialBookings || []}
      initialProfiles={initialProfiles || []}
    />
  );
}
