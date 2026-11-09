import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type PaymentType = "booking" | "airport" | "wedding" | "facilitator";

function getMpesaBaseUrl() {
  return process.env.MPESA_ENVIRONMENT === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function getTimestamp() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials are not configured.");
  }
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await fetch(
    `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error("Could not check the payment with M-Pesa. Please try again shortly.");
  }
  const data = await response.json();
  if (typeof data.access_token !== "string") {
    throw new Error("M-Pesa did not provide a payment status token.");
  }
  return data.access_token as string;
}

function getFailureReason(resultCode: number, description?: string) {
  const knownReasons: Record<number, string> = {
    1: "There is not enough M-Pesa balance to complete this payment.",
    17: "M-Pesa could not complete the request. Please try again later.",
    1032: "The M-Pesa payment was cancelled on the phone.",
    1037: "The M-Pesa prompt timed out before it was approved.",
    2001: "The M-Pesa PIN was not accepted. Check your PIN and try again.",
  };
  return knownReasons[resultCode] ??
    (description
      ? `M-Pesa could not complete the payment: ${description}`
      : `M-Pesa could not complete the payment (error ${resultCode}).`);
}

async function checkDarajaStatus(
  checkoutRequestId: string,
  expectedAmount: number,
) {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    throw new Error("M-Pesa payment-check configuration is incomplete.");
  }
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const response = await fetch(
    `${getMpesaBaseUrl()}/mpesa/stkpushquery/v1/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
      cache: "no-store",
    },
  );
  const result = await response.json();
  if (!response.ok || String(result.ResponseCode) !== "0") {
    throw new Error(
      typeof result.errorMessage === "string"
        ? result.errorMessage
        : "M-Pesa has not returned a final payment status yet.",
    );
  }
  const resultCode = Number(result.ResultCode);
  if (!Number.isFinite(resultCode)) {
    return { state: "pending" as const };
  }
  if (resultCode !== 0) {
    return {
      state: "failed" as const,
      reason: getFailureReason(resultCode, result.ResultDesc),
    };
  }
  return {
    state: "paid" as const,
    amount: expectedAmount,
    receiptNumber:
      typeof result.MpesaReceiptNumber === "string"
        ? result.MpesaReceiptNumber
        : null,
    transactionDate:
      typeof result.TransactionDate === "string" ? result.TransactionDate : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body?.type as PaymentType;
    const id = body?.id;
    if (
      !["booking", "airport", "wedding", "facilitator"].includes(type) ||
      typeof id !== "string" ||
      !id
    ) {
      return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
    }

    const sessionClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Sign in to check payment status." }, { status: 401 });
    }

    let checkoutRequestId: string | null = null;
    let expectedAmount = 0;
    let currentStatus = "";
    let authorized = false;
    let bookingCarId: string | null = null;
    let weddingPaymentAttempts = 0;
    let table: "bookings" | "airport_pickups" | "wedding_event_requests";

    if (type === "booking") {
      table = "bookings";
      const { data, error } = await sessionClient
        .from("bookings")
        .select("id, profile_id, status, total_price, checkout_request_id, car_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      authorized = data.profile_id === user.id;
      currentStatus = data.status ?? "pending";
      expectedAmount = Math.ceil(Number(data.total_price));
      checkoutRequestId = data.checkout_request_id;
      bookingCarId = data.car_id;
    } else if (type === "airport") {
      table = "airport_pickups";
      const { data, error } = await sessionClient
        .from("airport_pickups")
        .select("id, customer_id, status, payment_status, fare_amount, checkout_request_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Airport pickup not found." }, { status: 404 });
      authorized = data.customer_id === user.id;
      currentStatus = data.payment_status;
      expectedAmount = Math.ceil(Number(data.fare_amount));
      checkoutRequestId = data.checkout_request_id;
    } else if (type === "wedding") {
      table = "wedding_event_requests";
      const { data, error } = await sessionClient
        .from("wedding_event_requests")
        .select("id, customer_id, status, payment_status, quote_amount, payment_attempts, checkout_request_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Wedding quote not found." }, { status: 404 });
      authorized = data.customer_id === user.id;
      currentStatus = data.payment_status;
      expectedAmount = Math.ceil(Number(data.quote_amount));
      checkoutRequestId = data.checkout_request_id;
      weddingPaymentAttempts = data.payment_attempts;
    } else {
      table = "bookings";
      const { data, error } = await sessionClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error || !["facilitator", "super_admin"].includes(data?.role ?? "")) {
        return NextResponse.json({ error: "Not authorized to check this payment." }, { status: 403 });
      }
      const { data: booking, error: bookingError } = await sessionClient
        .from("bookings")
        .select("id, additional_fee_status, additional_fee_amount, facilitator_checkout_id")
        .eq("id", id)
        .maybeSingle();
      if (bookingError) throw bookingError;
      if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      authorized = true;
      currentStatus = booking.additional_fee_status ?? "pending";
      expectedAmount = Math.ceil(Number(booking.additional_fee_amount));
      checkoutRequestId = booking.facilitator_checkout_id;
    }

    if (!authorized) {
      const { data: profile, error } = await sessionClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error || profile?.role !== "super_admin") {
        return NextResponse.json({ error: "Not authorized to check this payment." }, { status: 403 });
      }
    }

    const pending = type === "booking"
      ? currentStatus === "pending"
      : currentStatus === "pending";
    if (!pending || !checkoutRequestId) {
      if (type === "booking" && currentStatus === "confirmed" && bookingCarId) {
        const { error } = await supabaseAdmin
          .from("cars")
          .update({ available: false })
          .eq("id", bookingCarId);
        if (error) throw error;
      }
      return NextResponse.json({ status: currentStatus, pending });
    }

    const query = await checkDarajaStatus(checkoutRequestId, expectedAmount);
    if (query.state === "pending") {
      return NextResponse.json({ status: currentStatus, pending: true });
    }

    const nowPaid = query.state === "paid";
    const updates =
      type === "booking"
        ? nowPaid
          ? {
              status: "confirmed",
              mpesa_receipt_number: query.receiptNumber,
              mpesa_transaction_date: query.transactionDate,
              paid_amount: query.amount,
              payment_failure_reason: null,
            }
          : { status: "failed", payment_failure_reason: query.reason }
        : type === "airport"
          ? nowPaid
            ? {
                status: "requested",
                payment_status: "paid",
                mpesa_receipt_number: query.receiptNumber,
                mpesa_transaction_date: query.transactionDate,
                paid_amount: query.amount,
                payment_failure_reason: null,
              }
            : {
                status: "payment_failed",
                payment_status: "failed",
                payment_failure_reason: query.reason,
              }
          : type === "wedding"
            ? nowPaid
              ? {
                  status: "confirmed",
                  payment_status: "paid",
                  mpesa_receipt_number: query.receiptNumber,
                  mpesa_transaction_date: query.transactionDate,
                  paid_amount: query.amount,
                  payment_failure_reason: null,
                }
              : {
                    ...(weddingPaymentAttempts >= 3 ? { status: "spam" } : {}),
                    payment_status: "failed",
                    payment_failure_reason: query.reason,
                  }
            : nowPaid
              ? {
                  additional_fee_status: "confirmed",
                  additional_fee_receipt: query.receiptNumber,
                  additional_fee_amount: query.amount,
                  additional_fee_reason: null,
                }
              : {
                  additional_fee_status: "failed",
                  additional_fee_reason: query.reason,
                };
    const statusColumn =
      type === "booking"
        ? "status"
        : type === "facilitator"
          ? "additional_fee_status"
          : "payment_status";
    const expectedCurrentStatus = currentStatus;
    const { error: updateError } = await supabaseAdmin
      .from(table)
      .update(updates)
      .eq("id", id)
      .eq(statusColumn, expectedCurrentStatus);
    if (updateError) throw updateError;
    if (type === "booking" && nowPaid && bookingCarId) {
      const { error } = await supabaseAdmin
        .from("cars")
        .update({ available: false })
        .eq("id", bookingCarId);
      if (error) throw error;
    }

    return NextResponse.json({
      status: nowPaid ? (type === "booking" ? "confirmed" : type === "airport" ? "paid" : type === "wedding" ? "paid" : "confirmed") : "failed",
      pending: false,
      reason: nowPaid ? null : query.reason,
      receiptNumber: nowPaid ? query.receiptNumber : null,
      amount: nowPaid ? query.amount : null,
    });
  } catch (error) {
    console.error("[mpesa/payment-status] Could not reconcile payment status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Could not check the M-Pesa payment status.",
        pending: true,
      },
      { status: 502 },
    );
  }
}
