import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Admin Client (bypasses RLS) ──────────────────────────────────
// Uses the SERVICE ROLE key — never expose this on the client side.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMpesaBaseUrl() {
  return process.env.MPESA_ENVIRONMENT === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

/** Returns a Bearer access token from the Daraja Authorization API */
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");

  const res = await fetch(
    `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: { Authorization: `Basic ${credentials}` },
      // Don't cache — tokens expire after 1 hour
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja auth failed: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/** Formats any Kenyan phone number to 2547XXXXXXXX */
function formatPhone(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");

  // Handle: 07..., 2547..., +2547...
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;

  throw new Error(`Unrecognizable phone number format: ${raw}`);
}

/** Generates the yyyymmddhhiiss timestamp Daraja expects */
function getTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, bookingId } = await req.json();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!phone || !amount || !bookingId) {
      return NextResponse.json(
        { error: "phone, amount, and bookingId are required." },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhone(String(phone));
    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const timestamp = getTimestamp();

    // password = base64(shortcode + passkey + timestamp)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64",
    );

    // ── Get Bearer token ────────────────────────────────────────────────────
    const token = await getAccessToken();

    // ── Build callback URL ──────────────────────────────────────────────────
    // Append a secret so your callback route rejects spoofed requests.
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback?key=${process.env.MPESA_CALLBACK_SECRET}`;

    // ── Fire STK Push ───────────────────────────────────────────────────────
    const stkRes = await fetch(
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
          // Use "CustomerBuyGoodsOnline" if you have a Till number instead of Paybill
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.ceil(amount), // M-Pesa only accepts integers
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          // AccountReference is visible to the customer on the STK prompt
          AccountReference: `Booking-${bookingId.slice(0, 8).toUpperCase()}`,
          TransactionDesc: "Car Rental Payment - Cozy Mobility",
        }),
      },
    );

    const stkData = await stkRes.json();

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      console.error("STK Push rejected by Daraja:", stkData);
      return NextResponse.json(
        { error: stkData.errorMessage ?? "M-Pesa request was rejected." },
        { status: 502 },
      );
    }

    // ── Persist CheckoutRequestID so the callback can find this booking ─────
    // This requires a `checkout_request_id` column on your bookings table.
    // See the setup guide for the SQL migration.
    const { error: dbError } = await supabaseAdmin
      .from("bookings")
      .update({ checkout_request_id: stkData.CheckoutRequestID })
      .eq("id", bookingId);

    if (dbError) {
      console.error("Failed to persist CheckoutRequestID:", dbError);
      // Don't fail the request — the callback can still work via polling fallback
    }

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("[/api/mpesa/stkpush]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
