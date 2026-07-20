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

  console.error(
    "[mpesa/callback] No booking found for CheckoutRequestID:",
    CheckoutRequestID,
  );
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
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
