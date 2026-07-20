import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { FacilitatorClient } from "@/components/facilitator/facilitator-client";
import { AuthGuard } from "@/components/auth/auth-guard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facilitator Dashboard",
  description: "Perform vehicle inspections and process car returns.",
  robots: { index: false, follow: false },
};

async function FacilitatorContent() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/auth/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profileData?.role;

  // super_admin can also access the facilitator view
  if (role !== "facilitator" && role !== "super_admin") redirect("/");

  // Fetch confirmed bookings only — server-side filter, not client-side
  // Include cars(price) so the client can calculate late fees
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*, cars(name, image, price), profiles(full_name, email, phone)")
    .eq("status", "confirmed")
    .order("return_date", { ascending: true }); // soonest return first

  if (bookingsError) {
    console.error("[FacilitatorPage] bookings fetch failed:", bookingsError);
  }

  return (
    <>
      <AuthGuard />
      <FacilitatorClient initialBookings={bookings ?? []} />
    </>
  );
}

export default function FacilitatorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FacilitatorContent />
    </Suspense>
  );
}