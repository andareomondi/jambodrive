"use server";

import { ADMIN_ROLES, requireRole } from "@/lib/auth/require-role";
import { canTransition } from "@/lib/domain/booking-status";
import type { Booking, BookingStatus, Car, Profile, ProfileRole } from "@/types";

const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "failed",
];

const PROFILE_ROLES: ProfileRole[] = ["customer", "super_admin", "facilitator"];

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function adminUpdateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<{ booking: Booking; carId: string | null }> {
  if (!id || !BOOKING_STATUSES.includes(status)) {
    throw new Error("A valid booking and status are required.");
  }

  const { supabase } = await requireRole(ADMIN_ROLES);

  const { data: current, error: currentError } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    throw new Error("Booking not found.");
  }

  if (!canTransition(current.status as BookingStatus | null, status)) {
    throw new Error("This status change is not allowed.");
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("*, cars(name, image), profiles(full_name, email, phone)")
    .single();

  if (error) throw new Error(error.message);
  return { booking: data, carId: data.car_id };
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
  const { supabase } = await requireRole(ADMIN_ROLES);

  const start = new Date(bookingData.pickup_date).getTime();
  const end = new Date(bookingData.return_date).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error("The return date must be after the pickup date.");
  }
  const days = Math.ceil((end - start) / 86_400_000);

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

  const { error: carError } = await supabase
    .from("cars")
    .update({ available: false })
    .eq("id", bookingData.car_id);
  if (carError) throw new Error(carError.message);

  return data;
}

// ── Cars ──────────────────────────────────────────────────────────────────────

export async function adminUpdateCarAvailability(
  carId: string,
  available: boolean,
): Promise<void> {
  const { supabase } = await requireRole(ADMIN_ROLES);
  const { error } = await supabase
    .from("cars")
    .update({ available })
    .eq("id", carId);
  if (error) throw new Error(error.message);
}

export async function adminDeleteCar(carId: string): Promise<void> {
  const { supabase } = await requireRole(ADMIN_ROLES);
  const { error } = await supabase.from("cars").delete().eq("id", carId);
  if (error) throw new Error(error.message);
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function adminUpdateUserRole(
  userId: string,
  role: ProfileRole,
): Promise<Profile> {
  const { supabase, user } = await requireRole(ADMIN_ROLES);

  if (!PROFILE_ROLES.includes(role)) {
    throw new Error("That role does not exist.");
  }
  if (userId === user.id && role !== "super_admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Data refresh ──────────────────────────────────────────────────────────────

export async function fetchAdminCars(): Promise<Car[]> {
  const { supabase } = await requireRole(ADMIN_ROLES);
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAdminBookings(): Promise<Booking[]> {
  const { supabase } = await requireRole(ADMIN_ROLES);
  const { data, error } = await supabase
    .from("bookings")
    .select("*, cars(name, image), profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAdminProfiles(): Promise<Profile[]> {
  const { supabase } = await requireRole(ADMIN_ROLES);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("join_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
