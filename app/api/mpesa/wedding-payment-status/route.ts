import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function getMpesaBaseUrl() {
  return process.env.MPESA_ENVIRONMENT === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function getTimestamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");
  const response = await fetch(
    `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(`Daraja authentication failed with status ${response.status}.`);
  }
  const data = await response.json();
  if (typeof data.access_token !== "string") {
    throw new Error("Daraja did not return an access token.");
  }
  return data.access_token as string;
}

export async function POST(request: NextRequest) {
  try {
    const { weddingEventRequestId } = await request.json();
    if (typeof weddingEventRequestId !== "string" || !weddingEventRequestId) {
      return NextResponse.json(
        { error: "Wedding enquiry ID is required." },
        { status: 400 },
      );
    }

    const sessionClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Sign in to check payment status." }, { status: 401 });
    }

    const { data: enquiry, error: enquiryError } = await sessionClient
      .from("wedding_event_requests")
      .select("id, customer_id, status, payment_status, payment_attempts, checkout_request_id")
      .eq("id", weddingEventRequestId)
      .single();
    if (enquiryError || !enquiry) {
      return NextResponse.json({ error: "Wedding enquiry not found." }, { status: 404 });
    }

    if (enquiry.customer_id !== user.id) {
      const { data: profile, error: profileError } = await sessionClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profileError || profile?.role !== "super_admin") {
        return NextResponse.json({ error: "Not authorized to check this payment." }, { status: 403 });
      }
    }

    if (enquiry.status !== "quoted" || enquiry.payment_status !== "pending") {
      return NextResponse.json({ paymentStatus: enquiry.payment_status, status: enquiry.status });
    }

    if (!enquiry.checkout_request_id) {
      return NextResponse.json(
        { paymentStatus: "pending", status: enquiry.status, reason: "Waiting for payment tracking details." },
      );
    }

    const token = await getAccessToken();
    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const timestamp = getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const queryResponse = await fetch(
      `${getMpesaBaseUrl()}/mpesa/stkpushquery/v1/query`,
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
          CheckoutRequestID: enquiry.checkout_request_id,
        }),
        cache: "no-store",
      },
    );
    const query = await queryResponse.json();
    if (!queryResponse.ok) {
      throw new Error(query.errorMessage ?? "Could not query M-Pesa payment.");
    }

    const resultCode = Number(query.ResultCode);
    if (
      Number(query.ResponseCode) === 0 &&
      Number.isFinite(resultCode) &&
      resultCode !== 0
    ) {
      const reason =
        typeof query.ResultDesc === "string" && query.ResultDesc
          ? query.ResultDesc
          : "M-Pesa did not complete the payment.";
      const { error: updateError } = await supabaseAdmin
        .from("wedding_event_requests")
        .update({
          status: enquiry.payment_attempts >= 3 ? "spam" : "quoted",
          payment_status: "failed",
          payment_failure_reason: reason,
        })
        .eq("id", enquiry.id)
        .eq("status", "quoted")
        .eq("payment_status", "pending")
        .eq("checkout_request_id", enquiry.checkout_request_id);
      if (updateError) {
        console.error("[mpesa/wedding-payment-status] Could not record failed query:", updateError);
        throw new Error("M-Pesa reported a failed payment, but the status could not be updated.");
      }
      return NextResponse.json({
        paymentStatus: "failed",
        status: enquiry.payment_attempts >= 3 ? "spam" : "quoted",
        reason,
      });
    }

    return NextResponse.json({
      paymentStatus: "pending",
      status: enquiry.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check payment status.";
    console.error("[mpesa/wedding-payment-status]", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
