"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  WeddingEventRequest,
  WeddingEventRequestStatus,
} from "@/types";

export interface WeddingEventRequestInput {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  eventDate: string;
  budgetMin: number;
  budgetMax: number;
  carCount: number;
  preferredCarTypes: string[];
  colorScheme: string;
  sampleCarIds: string[];
  venue: string;
  notes: string;
}

const WEDDING_CAR_TYPES = [
  "Premium",
  "Executive",
  "Luxury SUV",
  "Classic",
  "Convertible",
  "Vans",
  "Other",
];

const WEDDING_REQUEST_STATUSES: WeddingEventRequestStatus[] = [
  "new",
  "contacted",
  "quoted",
  "confirmed",
  "declined",
];

async function requireWeddingEventAdmin() {
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

  if (error || profile?.role !== "super_admin") {
    throw new Error("You are not authorized to manage wedding enquiries.");
  }

  return supabase;
}

export async function createWeddingEventRequest(
  input: WeddingEventRequestInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const contactName = input.contactName.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const contactPhone = input.contactPhone.replace(/[^\d+]/g, "");
  const colorScheme = input.colorScheme.trim();
  const venue = input.venue.trim();
  const notes = input.notes.trim();
  const budgetMin = Number(input.budgetMin);
  const budgetMax = Number(input.budgetMax);
  const carCount = Number(input.carCount);
  const eventDate = new Date(`${input.eventDate}T00:00:00`);
  const preferredCarTypes = [...new Set(input.preferredCarTypes)];
  const sampleCarIds = [...new Set(input.sampleCarIds)];

  if (contactName.length < 2 || contactName.length > 120) {
    throw new Error("Enter your name (2 to 120 characters).");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error("Enter a valid email address.");
  }
  if (!/^\+?\d{9,15}$/.test(contactPhone)) {
    throw new Error("Enter a valid phone number.");
  }
  if (
    !input.eventDate ||
    !Number.isFinite(eventDate.getTime()) ||
    eventDate <= new Date()
  ) {
    throw new Error("Choose a wedding date in the future.");
  }
  if (
    !Number.isSafeInteger(budgetMin) ||
    !Number.isSafeInteger(budgetMax) ||
    budgetMin < 1 ||
    budgetMax < budgetMin
  ) {
    throw new Error("Enter a valid budget range.");
  }
  if (!Number.isInteger(carCount) || carCount < 1 || carCount > 30) {
    throw new Error("Choose between 1 and 30 cars.");
  }
  if (
    preferredCarTypes.length < 1 ||
    preferredCarTypes.length > 8 ||
    preferredCarTypes.some((type) => !WEDDING_CAR_TYPES.includes(type))
  ) {
    throw new Error("Choose at least one valid car type.");
  }
  if (colorScheme.length < 2 || colorScheme.length > 120) {
    throw new Error("Describe your color scheme (2 to 120 characters).");
  }
  if (sampleCarIds.length > 12) {
    throw new Error("Select no more than 12 sample cars.");
  }
  if (venue.length > 200 || notes.length > 1500) {
    throw new Error("Venue or additional notes are too long.");
  }

  if (sampleCarIds.length > 0) {
    const { data: selectedCars, error: carError } = await supabase
      .from("cars")
      .select("id")
      .in("id", sampleCarIds);

    if (carError) throw new Error(`Could not validate sample cars: ${carError.message}`);
    if (selectedCars?.length !== sampleCarIds.length) {
      throw new Error("One or more selected sample cars are no longer available.");
    }
  }

  const { data, error } = await supabase
    .from("wedding_event_requests")
    .insert({
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      event_date: input.eventDate,
      budget_min: budgetMin,
      budget_max: budgetMax,
      car_count: carCount,
      preferred_car_types: preferredCarTypes,
      color_scheme: colorScheme,
      sample_car_ids: sampleCarIds,
      venue: venue || null,
      notes: notes || null,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not submit your wedding enquiry.");
  }

  return data;
}

export async function getAdminWeddingEventRequests(): Promise<WeddingEventRequest[]> {
  const supabase = await requireWeddingEventAdmin();
  const { data, error } = await supabase
    .from("wedding_event_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load wedding enquiries: ${error.message}`);
  }
  return data as WeddingEventRequest[];
}

export async function updateWeddingEventRequestStatus(
  id: string,
  status: WeddingEventRequestStatus,
  adminNotes: string,
): Promise<WeddingEventRequest> {
  const supabase = await requireWeddingEventAdmin();
  const notes = adminNotes.trim();

  if (!id || !WEDDING_REQUEST_STATUSES.includes(status)) {
    throw new Error("Choose a valid enquiry status.");
  }
  if (notes.length > 2000) {
    throw new Error("Admin notes must be 2,000 characters or fewer.");
  }

  const { data, error } = await supabase
    .from("wedding_event_requests")
    .update({ status, admin_notes: notes || null })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not update wedding enquiry.");
  }
  return data as WeddingEventRequest;
}
