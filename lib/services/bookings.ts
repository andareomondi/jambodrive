import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  BookingInsert,
  BookingStatusUpdate,
  BookingPaymentUpdate,
} from "@/types";

const BOOKING_WITH_RELATIONS = `
  *,
  cars ( name, image ),
  profiles ( full_name, email, phone )
` as const;

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_RELATIONS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getBookings: ${error.message}`);
  return data;
}

export async function getUserBookings(profileId: string): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, cars ( name, image )")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getUserBookings: ${error.message}`);
  return data;
}

export async function getBookingById(id: string): Promise<Booking> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_RELATIONS)
    .eq("id", id)
    .single();

  if (error) throw new Error(`getBookingById: ${error.message}`);
  return data;
}

export async function getBookingByCheckoutId(
  checkoutRequestId: string,
): Promise<Booking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_WITH_RELATIONS)
    .eq("checkout_request_id", checkoutRequestId)
    .maybeSingle();

  if (error) throw new Error(`getBookingByCheckoutId: ${error.message}`);
  return data;
}

export async function createBooking(
  bookingData: BookingInsert,
): Promise<Booking> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert([bookingData])
    .select()
    .single();

  if (error) throw new Error(`createBooking: ${error.message}`);
  return data;
}

export async function updateBookingStatus(
  id: string,
  updates: BookingStatusUpdate,
): Promise<Booking> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateBookingStatus: ${error.message}`);
  return data;
}

export async function updateBookingPayment(
  id: string,
  updates: BookingPaymentUpdate,
): Promise<Booking> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateBookingPayment: ${error.message}`);
  return data;
}

export async function updateAdditionalFee(
  id: string,
  updates: {
    additional_fee_status?: string;
    additional_fee_receipt?: string;
    additional_fee_amount?: number;
    additional_fee_reason?: string;
  },
): Promise<Booking> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateAdditionalFee: ${error.message}`);
  return data;
}
