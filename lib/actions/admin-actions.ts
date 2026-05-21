"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

// ─── Dashboard Data ───────────────────────────────────────────────────────────

export async function getDashboardData(userId: string) {
  const { data: user, error: userError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError || (user?.role !== "admin" && user?.role !== "facilitator")) {
    throw new Error("Unauthorized access");
  }

  const [carsRes, bookingsRes, profilesRes] = await Promise.all([
    supabaseAdmin
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("bookings")
      .select("*, cars(*), profiles(*)")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("*"),
  ]);

  return {
    cars: carsRes.data || [],
    bookings: bookingsRes.data || [],
    users: profilesRes.data || [],
    role: user.role,
  };
}

// ─── Car Return ───────────────────────────────────────────────────────────────

export async function processCarReturn(
  bookingId: string,
  carId: string,
  notes: string,
  damageFee: number,
) {
  try {
    const { error: bookingError } = await supabaseAdmin
      .from("bookings")
      .update({ status: "completed", notes })
      .eq("id", bookingId);

    if (bookingError) {
      console.error("[processCarReturn] Booking update failed:", bookingError);
      return { success: false, error: bookingError.message };
    }

    const { error: carError } = await supabaseAdmin
      .from("cars")
      .update({ available: true })
      .eq("id", carId);

    if (carError) {
      console.error("[processCarReturn] Car update failed:", carError);
      return { success: false, error: carError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[processCarReturn] Unexpected error:", err);
    return {
      success: false,
      error: err.message || "Failed to process return.",
    };
  }
} // ─── M-Pesa Helpers ───────────────────────────────────────────────────────────

function getMpesaBaseUrl() {
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
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    },
  );

  if (!res.ok) throw new Error("Failed to authenticate with M-Pesa");
  const data = await res.json();
  return data.access_token;
}

// ─── Facilitator STK Push ─────────────────────────────────────────────────────
//
// Uses the REAL callback URL (same endpoint as booking payments) so Safaricom
// can POST the result back. The callback handler routes by `facilitator_checkout_id`
// and updates `additional_fee_status`, which the frontend listens to via Realtime.
// No polling — polling the STK query endpoint is unreliable during PIN entry.

export async function initiateFacilitatorCharge(
  bookingId: string,
  phone: string,
  amount: number,
  reference: string,
): Promise<{ success: boolean; error?: string }> {
  const token = await getAccessToken();
  const timestamp = getTimestamp();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64",
  );

  let formattedPhone = phone.replace(/\D/g, "");
  if (formattedPhone.startsWith("0"))
    formattedPhone = `254${formattedPhone.slice(1)}`;
  else if (formattedPhone.startsWith("7"))
    formattedPhone = `254${formattedPhone}`;

  // The same callback endpoint used by booking payments.
  // The handler distinguishes by looking up facilitator_checkout_id.
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback?key=${process.env.MPESA_CALLBACK_SECRET}`;

  const res = await fetch(
    `${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    {
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
    },
  );

  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    return { success: false, error: data.errorMessage || "STK Push failed" };
  }

  // Store CheckoutRequestID so the callback handler can find this booking.
  const { error: dbError } = await supabaseAdmin
    .from("bookings")
    .update({
      facilitator_checkout_id: data.CheckoutRequestID,
      additional_fee_status: "pending",
    })
    .eq("id", bookingId);

  if (dbError) {
    console.error(
      "[initiateFacilitatorCharge] Failed to store facilitator_checkout_id:",
      dbError,
    );
    // STK push already fired — don't fail the request, just log it.
  }

  return { success: true };
}
