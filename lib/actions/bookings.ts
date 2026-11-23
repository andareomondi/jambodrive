"use server";

import { requireRole, STAFF_ROLES } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingStatusUpdate } from "@/types";

const CANCELLABLE_STATUSES = ["pending", "confirmed"];

/**
 * Customers may cancel their own pending or confirmed bookings; staff may
 * cancel any booking. Ownership is checked here, not only by RLS.
 */
export async function cancelBookingAction(id: string): Promise<Booking> {
  if (!id) throw new Error("A booking is required.");

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Please sign in to continue.");

  const { data: current, error: lookupError } = await supabase
    .from("bookings")
    .select("status, profile_id")
    .eq("id", id)
    .single();
  if (lookupError || !current) throw new Error("Booking not found.");

  if (!CANCELLABLE_STATUSES.includes(current.status ?? "")) {
    throw new Error("This booking can no longer be cancelled.");
  }

  if (current.profile_id !== user.id) {
    await requireRole(STAFF_ROLES);
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" } satisfies BookingStatusUpdate)
    .eq("id", id)
    .select("*, cars ( name, image ), profiles ( full_name, email, phone )")
    .single();

  if (error) throw new Error(`cancelBooking: ${error.message}`);
  return data;
}
