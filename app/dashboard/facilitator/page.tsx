import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatabaseService } from "@/lib/services";
import { FacilitatorClient } from "./facilitator-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facilitator Dashboard",
  description: "Perform vehicle inspections and process car returns.",
  robots: { index: false, follow: false },
};

export default async function FacilitatorPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Role check server-side
  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profileData?.role;

  if (role !== "facilitator" && role !== "admin") {
    redirect("/");
  }

  const db = new DatabaseService(supabase);

  // Only fetch confirmed bookings — all the facilitator ever needs
  const allBookings = await db.getBookings();
  const confirmedBookings = allBookings.filter(
    (b: any) => b.status === "confirmed",
  );

  return <FacilitatorClient initialBookings={confirmedBookings} />;
}
