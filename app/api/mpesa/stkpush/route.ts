import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";

// ─── Supabase Admin Client (bypasses RLS) ──────────────────────────────────
// Uses the SERVICE ROLE key — never expose this on the client side.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

async function markWeddingPaymentFailed(
  requestId: string,
  attempt: number,
  reason: string,
) {
  const { error } = await supabaseAdmin
    .from("wedding_event_requests")
    .update({
      status: attempt >= 3 ? "spam" : "quoted",
      payment_status: "failed",
      payment_failure_reason: reason,
    })
    .eq("id", requestId)
    .eq("status", "quoted")
    .eq("payment_status", "pending");

  if (error) {
    console.error("[mpesa/stkpush] Failed to save wedding payment failure:", error);
    throw new Error("Payment failed, but the enquiry status could not be updated. Please contact support.");
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, bookingId, airportPickupId, weddingEventRequestId } =
      await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "A phone number is required." },
        { status: 400 },
      );
    }

    let paymentAmount: number;
    let accountReference: string;
    let transactionDesc: string;
    let weddingPaymentAttempt = 0;

    if (airportPickupId) {
      const sessionClient = await createSessionClient();
      const {
        data: { user },
        error: authError,
      } = await sessionClient.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: "Sign in to pay for an airport pickup." },
          { status: 401 },
        );
      }

      const { data: pickup, error: pickupError } = await sessionClient
        .from("airport_pickups")
        .select("id, customer_id, fare_amount, status, payment_status")
        .eq("id", airportPickupId)
        .eq("customer_id", user.id)
        .single();

      if (pickupError || !pickup) {
        return NextResponse.json(
          { error: "Airport pickup request could not be found." },
          { status: 404 },
        );
      }
      if (pickup.status !== "pending_payment" || pickup.payment_status !== "pending") {
        return NextResponse.json(
          { error: "This airport pickup is not awaiting payment." },
          { status: 409 },
        );
      }

      paymentAmount = pickup.fare_amount;
      accountReference = `Airport-${pickup.id.slice(0, 8).toUpperCase()}`;
      transactionDesc = "Airport Pickup - Cosmara";
    } else if (weddingEventRequestId) {
      const sessionClient = await createSessionClient();
      const {
        data: { user },
        error: authError,
      } = await sessionClient.auth.getUser();
      if (authError || !user) {
        return NextResponse.json(
          { error: "Sign in to pay for a wedding transport quote." },
          { status: 401 },
        );
      }

      const { data: request, error: requestError } = await sessionClient
        .from("wedding_event_requests")
        .select("id, customer_id, status, quote_amount, payment_status, paid_amount, payment_attempts")
        .eq("id", weddingEventRequestId)
        .single();
      if (requestError || !request) {
        return NextResponse.json(
          { error: "Wedding quote could not be found." },
          { status: 404 },
        );
      }

      if (request.customer_id !== user.id) {
        const { data: profile, error: profileError } = await sessionClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profileError || profile?.role !== "super_admin") {
          return NextResponse.json(
            { error: "You are not authorized to collect payment for this quote." },
            { status: 403 },
          );
        }
      }
      if (
        request.status !== "quoted" ||
        request.payment_status === "paid" ||
        request.payment_status === "pending" ||
        Number(request.paid_amount ?? 0) > 0 ||
        request.payment_attempts >= 3 ||
        !request.quote_amount
      ) {
        return NextResponse.json(
          {
            error:
              request.payment_attempts >= 3
                ? "The three M-Pesa payment attempts have been used. This enquiry is closed."
                : "This wedding quote is not awaiting payment.",
          },
          { status: 409 },
        );
      }

      paymentAmount = request.quote_amount;
      accountReference = `Wedding-${request.id.slice(0, 8).toUpperCase()}`;
      transactionDesc = "Wedding Transport - Cosmara";
    } else {
      if (!bookingId || !amount || !Number.isFinite(Number(amount)) || Number(amount) < 1) {
        return NextResponse.json(
          { error: "phone, amount, and bookingId are required." },
          { status: 400 },
        );
      }
      paymentAmount = Number(amount);
      accountReference = `Booking-${String(bookingId).slice(0, 8).toUpperCase()}`;
      transactionDesc = "Car Rental Payment - Cosmara";
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

    if (weddingEventRequestId) {
      const sessionClient = await createSessionClient();
      const { data: attempt, error: reserveError } = await sessionClient.rpc(
        "reserve_wedding_event_payment",
        {
          p_request_id: weddingEventRequestId,
          p_phone: formattedPhone,
        },
      );

      if (reserveError || typeof attempt !== "number") {
        console.error("[mpesa/stkpush] Could not reserve wedding payment attempt:", reserveError);
        return NextResponse.json(
          {
            error:
              reserveError?.message ??
              "This quote is no longer available for payment. Refresh and check its current status.",
          },
          { status: 409 },
        );
      }
      weddingPaymentAttempt = attempt;
    }

    // ── Build callback URL ──────────────────────────────────────────────────
    // Append a secret so your callback route rejects spoofed requests.
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback?key=${process.env.MPESA_CALLBACK_SECRET}`;

    // ── Fire STK Push ───────────────────────────────────────────────────────
    let stkRes: Response;
    let stkData: {
      ResponseCode?: string;
      errorMessage?: string;
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
    };
    try {
      stkRes = await fetch(
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
          Amount: Math.ceil(paymentAmount), // M-Pesa only accepts integers
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          // AccountReference is visible to the customer on the STK prompt
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        }),
        },
      );
      stkData = await stkRes.json();
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Could not reach M-Pesa.";
      if (weddingEventRequestId) {
        await markWeddingPaymentFailed(
          weddingEventRequestId,
          weddingPaymentAttempt,
          reason,
        );
      }
      return NextResponse.json(
        { error: `M-Pesa request failed: ${reason}` },
        { status: 502 },
      );
    }

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      console.error("STK Push rejected by Daraja:", stkData);
      if (airportPickupId) {
        const { error: pickupUpdateError } = await supabaseAdmin
          .from("airport_pickups")
          .update({
            status: "payment_failed",
            payment_status: "failed",
            payment_failure_reason:
              stkData.errorMessage ?? "M-Pesa request was rejected.",
          })
          .eq("id", airportPickupId)
          .eq("payment_status", "pending");
        if (pickupUpdateError) {
          console.error(
            "Failed to mark airport pickup payment rejected:",
            pickupUpdateError,
          );
        }
      } else if (weddingEventRequestId) {
        await markWeddingPaymentFailed(
          weddingEventRequestId,
          weddingPaymentAttempt,
          stkData.errorMessage ?? "M-Pesa request was rejected.",
        );
      }
      return NextResponse.json(
        { error: stkData.errorMessage ?? "M-Pesa request was rejected." },
        { status: 502 },
      );
    }

    // ── Persist CheckoutRequestID so the callback can find this booking ─────
    // This requires a `checkout_request_id` column on your bookings table.
    // See the setup guide for the SQL migration.
    const { error: dbError } = airportPickupId
      ? await supabaseAdmin
          .from("airport_pickups")
          .update({ checkout_request_id: stkData.CheckoutRequestID })
          .eq("id", airportPickupId)
      : weddingEventRequestId
        ? await supabaseAdmin
            .from("wedding_event_requests")
            .update({
              checkout_request_id: stkData.CheckoutRequestID,
            })
            .eq("id", weddingEventRequestId)
            .eq("status", "quoted")
            .eq("payment_status", "pending")
        : await supabaseAdmin
          .from("bookings")
          .update({ checkout_request_id: stkData.CheckoutRequestID })
          .eq("id", bookingId);

    if (dbError) {
      console.error(
        `Failed to persist CheckoutRequestID for ${airportPickupId ? "airport pickup" : weddingEventRequestId ? "wedding quote" : "booking"}:`,
        dbError,
      );
      if (weddingEventRequestId) {
        return NextResponse.json(
          { error: "Could not safely track this payment request. Please try again." },
          { status: 500 },
        );
      }
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
