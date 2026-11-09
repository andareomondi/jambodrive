"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  AirportPickup,
  AirportPickupRate,
  AirportPickupStatus,
  ProfileRole,
} from "@/types";

export interface AirportPickupRequestInput {
  rateId: string;
  arrivalAt: string;
  flightNumber: string;
  passengerCount: number;
  luggageCount: number;
  contactPhone: string;
  customerNotes: string;
}

export interface AirportPickupRateInput {
  id?: string;
  airportCode: string;
  airportName: string;
  destination: string;
  fareAmount: number;
  isActive: boolean;
}

const AIRPORT_PICKUP_STATUSES: AirportPickupStatus[] = [
  "accepted",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
];

async function requireAirportPickupStaff(roles: ProfileRole[] = [
  "super_admin",
  "facilitator",
]) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Please sign in to continue.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || !roles.includes(profile.role as ProfileRole)) {
    throw new Error("You are not authorized to manage airport pickups.");
  }

  return { supabase, user };
}

export async function createAirportPickupRequest(
  input: AirportPickupRequestInput,
): Promise<AirportPickup> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Please sign in to request a pickup.");

  const flightNumber = input.flightNumber
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const phone = input.contactPhone.replace(/[^\d+]/g, "");
  const arrivalAt = new Date(input.arrivalAt);
  const passengerCount = Number(input.passengerCount);
  const luggageCount = Number(input.luggageCount);

  if (!input.rateId) throw new Error("Select an airport and destination.");
  if (!Number.isFinite(arrivalAt.getTime()) || arrivalAt <= new Date()) {
    throw new Error("Arrival time must be in the future.");
  }
  if (!/^[A-Z0-9-]{2,20}$/.test(flightNumber)) {
    throw new Error("Enter a valid flight number.");
  }
  if (!/^\+?\d{9,15}$/.test(phone)) {
    throw new Error("Enter a valid contact phone number.");
  }
  if (!Number.isInteger(passengerCount) || passengerCount < 1 || passengerCount > 30) {
    throw new Error("Passenger count must be between 1 and 30.");
  }
  if (!Number.isInteger(luggageCount) || luggageCount < 0 || luggageCount > 50) {
    throw new Error("Luggage count must be between 0 and 50.");
  }

  const { data: rate, error: rateError } = await supabase
    .from("airport_pickup_rates")
    .select(
      "id, airport_code, airport_name, destination, fare_amount, currency",
    )
    .eq("id", input.rateId)
    .eq("is_active", true)
    .single();

  if (rateError || !rate) {
    throw new Error("That airport route is no longer available.");
  }

  const { data, error } = await supabase
    .from("airport_pickups")
    .insert({
      customer_id: user.id,
      rate_id: rate.id,
      airport_code: rate.airport_code,
      airport_name: rate.airport_name,
      destination: rate.destination,
      fare_amount: rate.fare_amount,
      currency: rate.currency,
      arrival_at: arrivalAt.toISOString(),
      flight_number: flightNumber,
      passenger_count: passengerCount,
      luggage_count: luggageCount,
      contact_phone: phone,
      customer_notes: input.customerNotes.trim().slice(0, 1000) || null,
      status: "pending_payment",
      payment_status: "pending",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create airport pickup request.");
  }

  return data as AirportPickup;
}

export async function getAdminAirportPickupData(): Promise<{
  pickups: AirportPickup[];
  rates: AirportPickupRate[];
}> {
  const { supabase } = await requireAirportPickupStaff();
  const [pickupResult, rateResult] = await Promise.all([
    supabase
      .from("airport_pickups")
      .select("*, profiles!airport_pickups_customer_id_fkey(full_name, email)")
      .order("created_at", { ascending: false }),
    supabase
      .from("airport_pickup_rates")
      .select("*")
      .order("airport_name")
      .order("destination"),
  ]);

  if (pickupResult.error) {
    throw new Error(`Could not load airport pickup requests: ${pickupResult.error.message}`);
  }
  if (rateResult.error) {
    throw new Error(`Could not load airport pickup rates: ${rateResult.error.message}`);
  }

  return {
    pickups: pickupResult.data as AirportPickup[],
    rates: rateResult.data as AirportPickupRate[],
  };
}

export async function saveAirportPickupRate(
  input: AirportPickupRateInput,
): Promise<AirportPickupRate> {
  const { supabase } = await requireAirportPickupStaff(["super_admin"]);
  const airportCode = input.airportCode.trim().toUpperCase();
  const airportName = input.airportName.trim();
  const destination = input.destination.trim();
  const fareAmount = Number(input.fareAmount);

  if (!/^[A-Z0-9-]{2,12}$/.test(airportCode)) {
    throw new Error("Enter a valid airport code.");
  }
  if (!airportName || airportName.length > 100) {
    throw new Error("Airport name is required and must be under 100 characters.");
  }
  if (!destination || destination.length > 120) {
    throw new Error("Destination is required and must be under 120 characters.");
  }
  if (!Number.isSafeInteger(fareAmount) || fareAmount < 1) {
    throw new Error("Fare must be a positive whole amount in KES.");
  }

  const rateData = {
    airport_code: airportCode,
    airport_name: airportName,
    destination,
    fare_amount: fareAmount,
    currency: "KES" as const,
    is_active: input.isActive,
  };
  const query = input.id
    ? supabase
        .from("airport_pickup_rates")
        .update(rateData)
        .eq("id", input.id)
    : supabase.from("airport_pickup_rates").insert(rateData);
  const { data, error } = await query.select().single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save airport pickup rate.");
  }
  return data as AirportPickupRate;
}

export async function updateAirportPickupStatus(
  pickupId: string,
  status: AirportPickupStatus,
): Promise<void> {
  const { supabase } = await requireAirportPickupStaff();
  if (!AIRPORT_PICKUP_STATUSES.includes(status)) {
    throw new Error("Invalid airport pickup status.");
  }

  const { data: pickup, error: lookupError } = await supabase
    .from("airport_pickups")
    .select("status, payment_status")
    .eq("id", pickupId)
    .single();

  if (lookupError || !pickup) {
    throw new Error("Airport pickup request could not be found.");
  }
  if (pickup.payment_status !== "paid") {
    throw new Error("Only paid airport pickup requests can be managed.");
  }

  const allowedTransitions: Partial<
    Record<AirportPickupStatus, AirportPickupStatus[]>
  > = {
    requested: ["accepted", "rejected"],
    accepted: ["in_progress", "cancelled"],
    in_progress: ["completed"],
  };
  if (!allowedTransitions[pickup.status as AirportPickupStatus]?.includes(status)) {
    throw new Error("That status change is not allowed.");
  }

  const { error } = await supabase
    .from("airport_pickups")
    .update({ status })
    .eq("id", pickupId);
  if (error) throw new Error(`Could not update airport pickup: ${error.message}`);
}
