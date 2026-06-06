"use server";

// ============================================================
// lib/actions/facilitator.ts
// Server actions for the facilitator dashboard.
// Uses createClient() per call — never a global supabase instance.
// ============================================================

import { createClient } from "@/lib/supabase/server";

// ── Car return ────────────────────────────────────────────────────────────────

export async function processCarReturn(
  bookingId: string,
  carId: string,
  notes: string,
  damageFee: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      notes,
      ...(damageFee > 0 && { additional_fee_amount: damageFee }),
    })
    .eq("id", bookingId);

  if (bookingError) {
    console.error("[processCarReturn] booking update failed:", bookingError);
    return { success: false, error: bookingError.message };
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
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  // Normalise to 254XXXXXXXXX
  let formattedPhone = phone.replace(/\D/g, "");
  if (formattedPhone.startsWith("0"))
    formattedPhone = `254${formattedPhone.slice(1)}`;
  else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1"))
    formattedPhone = `254${formattedPhone}`;

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback?key=${process.env.MPESA_CALLBACK_SECRET}`;

  const res = await fetch(`${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
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

  const data = await res.json();

  if (!res.ok || data.ResponseCode !== "0") {
    return { success: false, error: data.errorMessage || "STK Push failed" };
  }

  // Store CheckoutRequestID so the callback handler can route to this booking
  const { error: dbError } = await supabase
    .from("bookings")
    .update({
      facilitator_checkout_id: data.CheckoutRequestID,
      additional_fee_status: "pending",
    })
    .eq("id", bookingId);

  if (dbError) {
    // STK already fired — log and continue, don't fail the request
    console.error("[initiateFacilitatorCharge] DB update failed:", dbError);
  }

  return { success: true };
}