"use server";

import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingStatusUpdate } from "@/types";

export async function cancelBookingAction(id: string): Promise<Booking> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" } satisfies BookingStatusUpdate)
    .eq("id", id)
    .select("*, cars ( name, image ), profiles ( full_name, email, phone )")
    .single();

  if (error) throw new Error(`cancelBooking: ${error.message}`);
  return data;
}
