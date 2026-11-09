"use server";

import { randomUUID } from "node:crypto";
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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    throw new Error(`Could not verify your account: ${authError.message}`);
  }

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

  const requestId = randomUUID();
  const { error } = await supabase
    .from("wedding_event_requests")
    .insert({
      id: requestId,
      customer_id: user?.id ?? null,
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
    });

  if (error) {
    throw new Error(error.message ?? "Could not submit your wedding enquiry.");
  }

  return { id: requestId };
}

export async function getUserWeddingEventRequests(
  customerId: string,
): Promise<WeddingEventRequest[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.id !== customerId) {
    throw new Error("You are not authorized to view these wedding enquiries.");
  }

  const { data, error } = await supabase
    .from("wedding_event_requests")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load your wedding enquiries: ${error.message}`);
  }
  return data as WeddingEventRequest[];
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

export async function markWeddingEventContacted(
  id: string,
  method: "email" | "whatsapp" | "call",
  adminNotes: string,
): Promise<WeddingEventRequest> {
  const supabase = await requireWeddingEventAdmin();
  const notes = adminNotes.trim();

  if (!id || !["email", "whatsapp", "call"].includes(method)) {
    throw new Error("Choose a valid contact method.");
  }
  if (notes.length > 2000) throw new Error("Admin notes must be 2,000 characters or fewer.");

  const { data, error } = await supabase
    .from("wedding_event_requests")
    .update({
      status: "contacted",
      admin_notes: notes || null,
      contact_method: method,
    })
    .eq("id", id)
    .eq("status", "new")
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "This enquiry is no longer awaiting contact.");
  }
  return data as WeddingEventRequest;
}

export async function saveWeddingEventQuote(
  id: string,
  amount: number,
  quoteNotes: string,
  adminNotes: string,
): Promise<WeddingEventRequest> {
  const supabase = await requireWeddingEventAdmin();
  const quote = Number(amount);
  const message = quoteNotes.trim();
  const notes = adminNotes.trim();
  if (!id || !Number.isSafeInteger(quote) || quote < 1) {
    throw new Error("Enter a valid quote amount in whole Kenyan shillings.");
  }
  if (message.length > 2000 || notes.length > 2000) {
    throw new Error("Quote and admin notes must be 2,000 characters or fewer.");
  }

  const { data: current, error: currentError } = await supabase
    .from("wedding_event_requests")
    .select("status, payment_status")
    .eq("id", id)
    .single();
  if (currentError || !current) {
    throw new Error(currentError?.message ?? "Wedding enquiry not found.");
  }
  if (
    current.status !== "contacted" &&
    !(current.status === "quoted" && !["pending", "paid"].includes(current.payment_status))
  ) {
    throw new Error("Only contacted enquiries or unpaid quotes can be quoted.");
  }

  const update = {
      status: "quoted",
      quote_amount: quote,
      quote_notes: message || null,
      admin_notes: notes || null,
      payment_status: "unpaid",
      payment_failure_reason: null,
      checkout_request_id: null,
    };
  let updateQuery = supabase
    .from("wedding_event_requests")
    .update(update)
    .eq("id", id)
    .eq("status", current.status);
  if (current.status === "quoted") {
    updateQuery = updateQuery.eq("payment_status", current.payment_status);
  }
  const { data, error } = await updateQuery.select().single();
  if (error || !data) {
    throw new Error(error?.message ?? "Quote changed concurrently; refresh and try again.");
  }
  return data as WeddingEventRequest;
}

export async function cancelWeddingEventEnquiry(
  id: string,
  status: Extract<WeddingEventRequestStatus, "cancelled" | "spam">,
  adminNotes: string,
): Promise<WeddingEventRequest> {
  const supabase = await requireWeddingEventAdmin();
  const notes = adminNotes.trim();
  if (!id || !["cancelled", "spam"].includes(status)) {
    throw new Error("Choose whether this enquiry is cancelled or spam.");
  }
  if (notes.length > 2000) throw new Error("Admin notes must be 2,000 characters or fewer.");

  const { data, error } = await supabase
    .from("wedding_event_requests")
    .update({ status, admin_notes: notes || null })
    .eq("id", id)
    .eq("status", "new")
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Only new enquiries can be cancelled or marked as spam.");
  }
  return data as WeddingEventRequest;
}

export async function saveWeddingEventAdminNotes(
  id: string,
  adminNotes: string,
): Promise<WeddingEventRequest> {
  const supabase = await requireWeddingEventAdmin();
  const notes = adminNotes.trim();
  if (!id || notes.length > 2000) {
    throw new Error("Admin notes must be 2,000 characters or fewer.");
  }
  const { data, error } = await supabase
    .from("wedding_event_requests")
    .update({ admin_notes: notes || null })
    .eq("id", id)
    .neq("status", "confirmed")
    .neq("status", "cancelled")
    .neq("status", "spam")
    .select()
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "This enquiry is locked or could not be updated.");
  }
  return data as WeddingEventRequest;
}
