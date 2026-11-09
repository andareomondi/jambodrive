import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface CallbackItem {
  Name: string;
  Value: string | number;
}

interface StkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: { Item: CallbackItem[] };
}

interface DarajaCallbackBody {
  Body: { stkCallback: StkCallback };
}

function findItem(items: CallbackItem[], name: string) {
  return items.find((i) => i.Name === name)?.Value ?? null;
}

export async function POST(req: NextRequest) {
  // ── 1. Validate secret ────────────────────────────────────────────────────
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.MPESA_CALLBACK_SECRET) {
    console.warn("[mpesa/callback] Invalid or missing secret key.");
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: DarajaCallbackBody;
  try {
    body = await req.json();
  } catch {
    console.error("[mpesa/callback] Failed to parse request body.");
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const callback = body?.Body?.stkCallback;
  if (!callback) {
    console.error("[mpesa/callback] Malformed callback body:", body);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
    callback;
  console.log(
    `[mpesa/callback] CheckoutRequestID=${CheckoutRequestID} ResultCode=${ResultCode}`,
  );

  // ── 3. Route: initial booking payment vs facilitator additional fee ────────
  // Try the initial booking payment path first.
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("checkout_request_id", CheckoutRequestID)
    .maybeSingle();

  if (booking) {
    await handleInitialPayment(
      booking.id,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // Not an initial payment — check facilitator additional fee path.
  const { data: facilitatorBooking } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("facilitator_checkout_id", CheckoutRequestID)
    .maybeSingle();

  if (facilitatorBooking) {
    await handleAdditionalFee(
      facilitatorBooking.id,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { data: airportPickup } = await supabaseAdmin
    .from("airport_pickups")
    .select("id")
    .eq("checkout_request_id", CheckoutRequestID)
    .maybeSingle();

  if (airportPickup) {
    await handleAirportPickupPayment(
      airportPickup.id,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { data: weddingRequest } = await supabaseAdmin
    .from("wedding_event_requests")
    .select("id, quote_amount")
    .eq("checkout_request_id", CheckoutRequestID)
    .maybeSingle();

  if (weddingRequest) {
    await handleWeddingQuotePayment(
      weddingRequest.id,
      weddingRequest.quote_amount,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  console.error(
    "[mpesa/callback] No booking found for CheckoutRequestID:",
    CheckoutRequestID,
  );
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

async function handleWeddingQuotePayment(
  requestId: string,
  quoteAmount: number | null,
  resultCode: number,
  resultDesc: string,
  metadata?: { Item: CallbackItem[] },
) {
  if (resultCode === 0 && metadata && quoteAmount !== null) {
    const items = metadata.Item;
    const paidAmount = Number(findItem(items, "Amount") ?? 0);
    const exactPayment = paidAmount === quoteAmount;
    const { error } = await supabaseAdmin
      .from("wedding_event_requests")
      .update({
        status: exactPayment ? "confirmed" : "quoted",
        payment_status: exactPayment ? "paid" : "failed",
        mpesa_receipt_number: String(findItem(items, "MpesaReceiptNumber") ?? ""),
        mpesa_transaction_date: String(findItem(items, "TransactionDate") ?? ""),
        mpesa_phone: String(findItem(items, "PhoneNumber") ?? ""),
        paid_amount: paidAmount,
        payment_failure_reason: exactPayment
          ? null
          : `Payment amount did not match the quote of KSh ${quoteAmount.toLocaleString("en-KE")}.`,
      })
      .eq("id", requestId)
      .eq("status", "quoted")
      .eq("payment_status", "pending");

    if (error) {
      console.error("[mpesa/callback] Failed to record wedding quote payment:", error);
    } else {
      console.log(
        `[mpesa/callback] Wedding request ${requestId} payment ${exactPayment ? "confirmed" : "requires review"}.`,
      );
    }
    return;
  }

  const { error } = await supabaseAdmin
    .from("wedding_event_requests")
    .update({
      payment_status: "failed",
      payment_failure_reason: resultDesc,
    })
    .eq("id", requestId)
    .eq("status", "quoted")
    .eq("payment_status", "pending");
  if (error) {
    console.error("[mpesa/callback] Failed to mark wedding quote payment failed:", error);
  } else {
    console.log(`[mpesa/callback] Wedding request ${requestId} payment failed: ${resultDesc}`);
  }
}

async function handleAirportPickupPayment(
  pickupId: string,
  resultCode: number,
  resultDesc: string,
  metadata?: { Item: CallbackItem[] },
) {
  if (resultCode === 0 && metadata) {
    const items = metadata.Item;
    const { error } = await supabaseAdmin
      .from("airport_pickups")
      .update({
        status: "requested",
        payment_status: "paid",
        mpesa_receipt_number: String(
          findItem(items, "MpesaReceiptNumber") ?? "",
        ),
        mpesa_transaction_date: String(
          findItem(items, "TransactionDate") ?? "",
        ),
        mpesa_phone: String(findItem(items, "PhoneNumber") ?? ""),
        paid_amount: Number(findItem(items, "Amount") ?? 0),
      })
      .eq("id", pickupId)
      .eq("payment_status", "pending");

    if (error) {
      console.error(
        "[mpesa/callback] Failed to confirm airport pickup:",
        error,
      );
    } else {
      console.log(`[mpesa/callback] Airport pickup ${pickupId} paid.`);
    }
    return;
  }

  const { error } = await supabaseAdmin
    .from("airport_pickups")
    .update({
      status: "payment_failed",
      payment_status: "failed",
      payment_failure_reason: resultDesc,
    })
    .eq("id", pickupId)
    .eq("payment_status", "pending");

  if (error) {
    console.error(
      "[mpesa/callback] Failed to mark airport pickup payment failed:",
      error,
    );
  } else {
    console.log(
      `[mpesa/callback] Airport pickup ${pickupId} failed: ${resultDesc}`,
    );
  }
}

// ── Path A: Initial booking payment ──────────────────────────────────────────

async function handleInitialPayment(
  bookingId: string,
  resultCode: number,
  resultDesc: string,
  metadata?: { Item: CallbackItem[] },
) {
  if (resultCode === 0 && metadata) {
    const items = metadata.Item;
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        mpesa_receipt_number: findItem(items, "MpesaReceiptNumber"),
        mpesa_transaction_date: findItem(items, "TransactionDate"),
        mpesa_phone: String(findItem(items, "PhoneNumber") ?? ""),
        paid_amount: findItem(items, "Amount"),
      })
      .eq("id", bookingId);

    if (error)
      console.error("[mpesa/callback] Failed to confirm booking:", error);
    else console.log(`[mpesa/callback] Booking ${bookingId} confirmed.`);
  } else {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "failed", payment_failure_reason: resultDesc })
      .eq("id", bookingId);

    if (error)
      console.error("[mpesa/callback] Failed to mark booking failed:", error);
    else
      console.log(
        `[mpesa/callback] Booking ${bookingId} failed: ${resultDesc}`,
      );
  }
}

// ── Path B: Facilitator additional fee ───────────────────────────────────────
// Only touches additional_fee_* columns. The facilitator page Realtime listener
// watches these and commits the car return after confirmation.

async function handleAdditionalFee(
  bookingId: string,
  resultCode: number,
  resultDesc: string,
  metadata?: { Item: CallbackItem[] },
) {
  if (resultCode === 0 && metadata) {
    const items = metadata.Item;
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        additional_fee_status: "confirmed",
        additional_fee_receipt: findItem(items, "MpesaReceiptNumber"),
        additional_fee_amount: findItem(items, "Amount"),
      })
      .eq("id", bookingId);

    if (error)
      console.error(
        "[mpesa/callback] Failed to confirm additional fee:",
        error,
      );
    else
      console.log(
        `[mpesa/callback] Additional fee confirmed for booking ${bookingId}.`,
      );
  } else {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        additional_fee_status: "failed",
        additional_fee_reason: resultDesc,
      })
      .eq("id", bookingId);

    if (error)
      console.error(
        "[mpesa/callback] Failed to mark additional fee failed:",
        error,
      );
    else
      console.log(
        `[mpesa/callback] Additional fee failed for booking ${bookingId}: ${resultDesc}`,
      );
  }
}
