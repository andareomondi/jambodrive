"use server";

import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingStatus, Car, Profile } from "@/types";

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function adminUpdateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<{ booking: Booking; carId: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("*, cars(name, image), profiles(full_name, email, phone)")
    .single();

  if (error) throw new Error(error.message);
  return { booking: data, carId: data.car_id };
}

export async function adminUpdateCarAvailability(
  carId: string,
  available: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cars")
    .update({ available })
    .eq("id", carId);
  if (error) throw new Error(error.message);
}

export async function adminCreateBooking(bookingData: {
  car_id: string;
  profile_id: string | null;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_price: number;
  insurance: boolean;
}): Promise<Booking> {
  const supabase = await createClient();

  const days = Math.ceil(
    (new Date(bookingData.return_date).getTime() -
      new Date(bookingData.pickup_date).getTime()) /
      86_400_000
  );

  const { data, error } = await supabase
    .from("bookings")
    .insert([
      {
        ...bookingData,
        profile_id:
          bookingData.profile_id === "none" ? null : bookingData.profile_id,
        status: "confirmed", // admin bookings skip pending
        days,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Mark car as unavailable
  await supabase
    .from("cars")
    .update({ available: false })
    .eq("id", bookingData.car_id);

  return data;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function adminUpdateUserRole(
  userId: string,
  role: string
): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Cars ──────────────────────────────────────────────────────────────────────

export async function adminDeleteCar(carId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("cars").delete().eq("id", carId);
  if (error) throw new Error(error.message);
}

// ── Data refresh ──────────────────────────────────────────────────────────────

export async function fetchAdminCars(): Promise<Car[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAdminBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, cars(name, image), profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAdminProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("join_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
