"use server";

// ============================================================
// lib/actions/facilitator.ts
// Server actions for the facilitator dashboard.
// Uses createClient() per call — never a global supabase instance.
// ============================================================

import { createClient } from "@/lib/supabase/server";

async function requireFacilitatorAccess() {
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

  if (error || !profile || !["facilitator", "super_admin"].includes(profile.role)) {
    throw new Error("You are not authorized to process vehicle returns.");
  }

  return supabase;
}

// ── Car return ────────────────────────────────────────────────────────────────

export async function processCarReturn(
  bookingId: string,
  carId: string,
  notes: string,
  damageFee: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await requireFacilitatorAccess();

  if (
    !bookingId ||
    !carId ||
    typeof notes !== "string" ||
    notes.length > 5000 ||
    !Number.isSafeInteger(damageFee) ||
    damageFee < 0
  ) {
    return { success: false, error: "Invalid return details." };
  }

  const { data: booking, error: lookupError } = await supabase
    .from("bookings")
    .select("car_id, status")
    .eq("id", bookingId)
    .single();

  if (lookupError || !booking) {
    return { success: false, error: "Booking could not be found." };
  }
  if (booking.status !== "confirmed" || booking.car_id !== carId) {
    return { success: false, error: "This booking is not eligible for return processing." };
  }

  const { data: updatedBooking, error: bookingError } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      notes,
      ...(damageFee > 0 && { additional_fee_amount: damageFee }),
    })
    .eq("id", bookingId)
    .eq("car_id", carId)
    .eq("status", "confirmed")
    .select("id")
    .maybeSingle();

  if (bookingError || !updatedBooking) {
    console.error("[processCarReturn] booking update failed:", bookingError);
    return {
      success: false,
      error: bookingError?.message ?? "Booking has already been processed.",
    };
  }

  const { error: carError } = await supabase
    .from("cars")
    .update({ available: true })
    .eq("id", carId);

  if (carError) {
    console.error("[processCarReturn] car update failed:", carError);
    return { success: false, error: carError.message };
  }

  return { success: true };
}

// ── M-Pesa helpers ────────────────────────────────────────────────────────────

function getMpesaBaseUrl(): string {
  return process.env.MPESA_ENVIRONMENT === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function getTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");

  const res = await fetch(
    `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` }, cache: "no-store" },
  );

  if (!res.ok) throw new Error("Failed to authenticate with M-Pesa");
  const data = await res.json();
  return data.access_token;
}

// ── Facilitator STK push ──────────────────────────────────────────────────────
// Uses the same callback URL as booking payments.
// The callback handler routes by facilitator_checkout_id and updates
// additional_fee_status, which the client subscribes to via Supabase Realtime.

export async function initiateFacilitatorCharge(
  bookingId: string,
  phone: string,
  amount: number,
  reference: string,
): Promise<{ success: boolean; error?: string; paymentMayBePending?: boolean }> {
  const supabase = await requireFacilitatorAccess();

  if (!bookingId || !Number.isSafeInteger(amount) || amount < 1) {
    return { success: false, error: "A valid booking and fee amount are required." };
  }

  if (typeof phone !== "string") {
    return { success: false, error: "Enter a valid customer phone number." };
  }

  const { data: booking, error: bookingLookupError } = await supabase
    .from("bookings")
    .select("status, additional_fee_status")
    .eq("id", bookingId)
    .single();
  if (bookingLookupError || !booking || booking.status !== "confirmed") {
    return { success: false, error: "This booking is not eligible for an additional charge." };
  }
  if (booking.additional_fee_status === "pending") {
    return {
      success: false,
      error: "An additional-fee payment is already pending for this booking.",
    };
  }

  const digits = phone.replace(/\D/g, "");
  const localNumber = digits.startsWith("254")
    ? digits.slice(3)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  if (!/^[17]\d{8}$/.test(localNumber)) {
    return { success: false, error: "Enter a valid customer phone number." };
  }

  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  // Normalise to 254XXXXXXXXX
  const formattedPhone = `254${localNumber}`;

  if (!process.env.NEXT_PUBLIC_APP_URL || !process.env.MPESA_CALLBACK_SECRET) {
    return { success: false, error: "M-Pesa callback configuration is incomplete." };
  }

  const { data: reservedBooking, error: reserveError } = await supabase
    .from("bookings")
    .update({
      additional_fee_status: "pending",
      additional_fee_amount: amount,
      additional_fee_reason: null,
      facilitator_checkout_id: null,
    })
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .or("additional_fee_status.is.null,additional_fee_status.neq.pending")
    .select("id")
    .maybeSingle();

  if (reserveError || !reservedBooking) {
    console.error("[initiateFacilitatorCharge] Could not reserve fee payment:", reserveError);
    return {
      success: false,
      error: "Another payment is already pending for this booking. Refresh and check its status.",
    };
  }

  const callbackParams = new URLSearchParams({
    key: process.env.MPESA_CALLBACK_SECRET,
    type: "facilitator",
    id: bookingId,
  });
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback?${callbackParams}`;

  let res: Response;
  let data: {
    ResponseCode?: string;
    errorMessage?: string;
    CheckoutRequestID?: string;
  };
  try {
    res = await fetch(`${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: reference.slice(0, 12),
      TransactionDesc: "Additional Fees - Cosmara",
    }),
  });

    data = await res.json();
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Could not reach M-Pesa.";
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        additional_fee_reason:
          "M-Pesa did not confirm whether the request was accepted. Do not retry if the prompt arrives; contact support if it does not.",
      })
      .eq("id", bookingId)
      .eq("additional_fee_status", "pending");
    if (updateError) {
      console.error("[initiateFacilitatorCharge] Could not record request failure:", updateError);
      return {
        success: false,
        paymentMayBePending: true,
        error: "M-Pesa did not confirm whether the request was accepted. Check the booking before retrying.",
      };
    }
    return {
      success: false,
      paymentMayBePending: true,
      error: `M-Pesa did not confirm whether the request was accepted (${reason}). Do not retry if the prompt arrives; contact support if it does not.`,
    };
  }

  if (!res.ok || data.ResponseCode !== "0") {
    const reason = data.errorMessage || "M-Pesa rejected the payment request.";
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        additional_fee_status: "failed",
        additional_fee_reason: reason,
      })
      .eq("id", bookingId)
      .eq("additional_fee_status", "pending");
    if (updateError) {
      console.error("[initiateFacilitatorCharge] Could not record rejected request:", updateError);
      return { success: false, error: "M-Pesa rejected the request and its status could not be saved. Contact support." };
    }
    return { success: false, error: reason };
  }

  // Store CheckoutRequestID so the callback handler can route to this booking
  const { data: updatedBooking, error: dbError } = await supabase
    .from("bookings")
    .update({
      facilitator_checkout_id: data.CheckoutRequestID,
    })
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .eq("additional_fee_status", "pending")
    .select("id")
    .maybeSingle();

  if (dbError) {
    console.error("[initiateFacilitatorCharge] DB update failed:", dbError);
    return {
      success: false,
      paymentMayBePending: true,
      error: "M-Pesa prompt was sent, but its status could not be saved. Check the booking before retrying.",
    };
  }
  if (!updatedBooking) {
    const { data: settledBooking, error: statusError } = await supabase
      .from("bookings")
      .select("additional_fee_status")
      .eq("id", bookingId)
      .single();
    if (statusError) {
      console.error("[initiateFacilitatorCharge] Could not verify early callback:", statusError);
      return {
        success: false,
        paymentMayBePending: true,
        error: "The payment prompt was sent. Check the booking status before retrying.",
      };
    }
    if (["confirmed", "failed"].includes(settledBooking.additional_fee_status ?? "")) {
      return { success: true };
    }
    return {
      success: false,
      paymentMayBePending: true,
      error: "The payment prompt was sent, but its status could not be saved. Check the booking before retrying.",
    };
  }

  return { success: true };
}