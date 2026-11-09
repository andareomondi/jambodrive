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
  MerchantRequestID?: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc?: string;
  CallbackMetadata?: { Item: CallbackItem[] };
}

interface DarajaCallbackBody {
  Body?: { stkCallback?: StkCallback };
}

type PaymentType = "booking" | "airport" | "wedding" | "facilitator";

function findItem(items: CallbackItem[] | undefined, name: string) {
  return items?.find((item) => item.Name === name)?.Value ?? null;
}

function getFailureReason(resultCode: number, resultDesc?: string) {
  const knownReasons: Record<number, string> = {
    1: "There is not enough M-Pesa balance to complete this payment.",
    17: "M-Pesa could not complete the request. Please try again later.",
    1032: "The M-Pesa payment was cancelled on the phone.",
    1037: "The M-Pesa prompt timed out before it was approved.",
    2001: "The M-Pesa PIN was not accepted. Check your PIN and try again.",
  };
  if (knownReasons[resultCode]) return knownReasons[resultCode];
  if (resultDesc?.trim()) return `M-Pesa could not complete the payment: ${resultDesc.trim()}`;
  return `M-Pesa could not complete the payment (error ${resultCode}).`;
}

function callbackError(message: string, status = 500) {
  return NextResponse.json(
    { ResultCode: 1, ResultDesc: message },
    { status },
  );
}

async function updateBooking(
  id: string,
  callback: StkCallback,
) {
  const { data: booking, error: lookupError } = await supabaseAdmin
    .from("bookings")
    .select("id, car_id, status, total_price, checkout_request_id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!booking) return;
  if (booking.status === "confirmed" && booking.car_id) {
    const { error } = await supabaseAdmin
      .from("cars")
      .update({ available: false })
      .eq("id", booking.car_id);
    if (error) throw error;
    return;
  }
  if (booking.status !== "pending") return;
  if (
    booking.checkout_request_id &&
    booking.checkout_request_id !== callback.CheckoutRequestID
  ) return;

  const items = callback.CallbackMetadata?.Item;
  const amount = Number(findItem(items, "Amount"));
  const isPaid =
    callback.ResultCode === 0 &&
    Number.isFinite(amount) &&
    amount === Math.ceil(Number(booking.total_price));
  const update = isPaid
    ? {
        status: "confirmed",
        checkout_request_id: callback.CheckoutRequestID,
        mpesa_receipt_number: findItem(items, "MpesaReceiptNumber"),
        mpesa_transaction_date: String(findItem(items, "TransactionDate") ?? ""),
        mpesa_phone: String(findItem(items, "PhoneNumber") ?? ""),
        paid_amount: amount,
        payment_failure_reason: null,
      }
    : {
        status: "failed",
        checkout_request_id: callback.CheckoutRequestID,
        paid_amount: Number.isFinite(amount) && amount > 0 ? amount : null,
        payment_failure_reason:
          callback.ResultCode === 0
            ? "M-Pesa reported payment, but the amount could not be verified. Contact support before trying again."
            : getFailureReason(callback.ResultCode, callback.ResultDesc),
      };

  const { error } = await supabaseAdmin
    .from("bookings")
    .update(update)
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw error;
  if (isPaid && booking.car_id) {
    const { error: carError } = await supabaseAdmin
      .from("cars")
      .update({ available: false })
      .eq("id", booking.car_id);
    if (carError) throw carError;
  }
}

async function updateAirportPickup(
  id: string,
  callback: StkCallback,
) {
  const { data: pickup, error: lookupError } = await supabaseAdmin
    .from("airport_pickups")
    .select("id, status, payment_status, fare_amount, checkout_request_id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!pickup || pickup.payment_status !== "pending") return;
  if (
    pickup.checkout_request_id &&
    pickup.checkout_request_id !== callback.CheckoutRequestID
  ) return;

  const items = callback.CallbackMetadata?.Item;
  const amount = Number(findItem(items, "Amount"));
  const isPaid =
    callback.ResultCode === 0 &&
    Number.isFinite(amount) &&
    amount === Math.ceil(Number(pickup.fare_amount));

  const { error } = await supabaseAdmin
    .from("airport_pickups")
    .update(
      isPaid
        ? {
            status: "requested",
            payment_status: "paid",
            checkout_request_id: callback.CheckoutRequestID,
            mpesa_receipt_number: String(findItem(items, "MpesaReceiptNumber") ?? ""),
            mpesa_transaction_date: String(findItem(items, "TransactionDate") ?? ""),
            mpesa_phone: String(findItem(items, "PhoneNumber") ?? ""),
            paid_amount: amount,
            payment_failure_reason: null,
          }
        : {
            status: "payment_failed",
            payment_status: "failed",
            checkout_request_id: callback.CheckoutRequestID,
            paid_amount: Number.isFinite(amount) && amount > 0 ? amount : null,
            payment_failure_reason:
              callback.ResultCode === 0
                ? "M-Pesa reported payment, but the amount could not be verified. Contact support before trying again."
                : getFailureReason(callback.ResultCode, callback.ResultDesc),
          },
    )
    .eq("id", id)
    .eq("payment_status", "pending");
  if (error) throw error;
}

async function updateWeddingPayment(
  id: string,
  callback: StkCallback,
  expectedAttempt?: number,
) {
  const { data: request, error: lookupError } = await supabaseAdmin
    .from("wedding_event_requests")
    .select("id, status, payment_status, quote_amount, payment_attempts, checkout_request_id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!request || request.status !== "quoted" || request.payment_status !== "pending") return;
  if (expectedAttempt !== undefined && request.payment_attempts !== expectedAttempt) return;
  if (
    request.checkout_request_id &&
    request.checkout_request_id !== callback.CheckoutRequestID
  ) return;

  const items = callback.CallbackMetadata?.Item;
  const amount = Number(findItem(items, "Amount"));
  const isPaid =
    callback.ResultCode === 0 &&
    Number.isFinite(amount) &&
    amount === Math.ceil(Number(request.quote_amount));
  const reason =
    callback.ResultCode === 0
      ? "M-Pesa reported payment, but the amount could not be verified. Contact support before trying again."
      : getFailureReason(callback.ResultCode, callback.ResultDesc);
  const { error } = await supabaseAdmin
    .from("wedding_event_requests")
    .update(
      isPaid
        ? {
            status: "confirmed",
            payment_status: "paid",
            checkout_request_id: callback.CheckoutRequestID,
            mpesa_receipt_number: String(findItem(items, "MpesaReceiptNumber") ?? ""),
            mpesa_transaction_date: String(findItem(items, "TransactionDate") ?? ""),
            mpesa_phone: String(findItem(items, "PhoneNumber") ?? ""),
            paid_amount: amount,
            payment_failure_reason: null,
          }
        : {
            status: request.payment_attempts >= 3 ? "spam" : "quoted",
            payment_status: "failed",
            checkout_request_id: callback.CheckoutRequestID,
            paid_amount: Number.isFinite(amount) && amount > 0 ? amount : null,
            payment_failure_reason: reason,
          },
    )
    .eq("id", id)
    .eq("status", "quoted")
    .eq("payment_status", "pending")
    .eq("payment_attempts", request.payment_attempts);
  if (error) throw error;
}

async function updateFacilitatorFee(
  id: string,
  callback: StkCallback,
) {
  const { data: booking, error: lookupError } = await supabaseAdmin
    .from("bookings")
    .select("id, facilitator_checkout_id, additional_fee_status, additional_fee_amount")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!booking || booking.additional_fee_status !== "pending") return;
  if (
    booking.facilitator_checkout_id &&
    booking.facilitator_checkout_id !== callback.CheckoutRequestID
  ) return;

  const items = callback.CallbackMetadata?.Item;
  const amount = Number(findItem(items, "Amount"));
  const expectedAmount = Math.ceil(Number(booking.additional_fee_amount));
  const isPaid =
    callback.ResultCode === 0 &&
    Number.isFinite(amount) &&
    amount === expectedAmount;
  const failureReason =
    callback.ResultCode === 0
      ? Number.isFinite(amount) && amount > 0
        ? `M-Pesa received KSh ${amount.toLocaleString("en-KE")}, but the expected fee was KSh ${expectedAmount.toLocaleString("en-KE")}. Contact support to reconcile the payment.`
        : "M-Pesa reported payment, but the amount could not be verified. Contact support."
      : getFailureReason(callback.ResultCode, callback.ResultDesc);
  const { error } = await supabaseAdmin
    .from("bookings")
    .update(
      isPaid
        ? {
            additional_fee_status: "confirmed",
            facilitator_checkout_id: callback.CheckoutRequestID,
            additional_fee_receipt: findItem(items, "MpesaReceiptNumber"),
            additional_fee_amount: amount,
            additional_fee_reason: null,
          }
        : {
            additional_fee_status: "failed",
            facilitator_checkout_id: callback.CheckoutRequestID,
            additional_fee_amount:
              Number.isFinite(amount) && amount > 0
                ? amount
                : booking.additional_fee_amount,
            additional_fee_reason: failureReason,
          },
    )
    .eq("id", id)
    .eq("additional_fee_status", "pending");
  if (error) throw error;
}

async function processCallback(
  type: PaymentType,
  id: string,
  callback: StkCallback,
  attempt?: number,
) {
  switch (type) {
    case "booking":
      return updateBooking(id, callback);
    case "airport":
      return updateAirportPickup(id, callback);
    case "wedding":
      return updateWeddingPayment(id, callback, attempt);
    case "facilitator":
      return updateFacilitatorFee(id, callback);
  }
}

async function findLegacyPayment(callback: StkCallback) {
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("checkout_request_id", callback.CheckoutRequestID)
    .maybeSingle();
  if (bookingError) throw bookingError;
  if (booking) return processCallback("booking", booking.id, callback);

  const { data: facilitatorBooking, error: facilitatorError } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("facilitator_checkout_id", callback.CheckoutRequestID)
    .maybeSingle();
  if (facilitatorError) throw facilitatorError;
  if (facilitatorBooking) return processCallback("facilitator", facilitatorBooking.id, callback);

  const { data: pickup, error: pickupError } = await supabaseAdmin
    .from("airport_pickups")
    .select("id")
    .eq("checkout_request_id", callback.CheckoutRequestID)
    .maybeSingle();
  if (pickupError) throw pickupError;
  if (pickup) return processCallback("airport", pickup.id, callback);

  const { data: weddingRequest, error: weddingError } = await supabaseAdmin
    .from("wedding_event_requests")
    .select("id, payment_attempts")
    .eq("checkout_request_id", callback.CheckoutRequestID)
    .maybeSingle();
  if (weddingError) throw weddingError;
  if (weddingRequest) {
    return processCallback(
      "wedding",
      weddingRequest.id,
      callback,
      weddingRequest.payment_attempts,
    );
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.MPESA_CALLBACK_SECRET) {
    console.error("[mpesa/callback] MPESA_CALLBACK_SECRET is not configured.");
    return callbackError("Callback authentication is not configured.", 500);
  }
  if (request.nextUrl.searchParams.get("key") !== process.env.MPESA_CALLBACK_SECRET) {
    console.warn("[mpesa/callback] Rejected callback with an invalid key.");
    return callbackError("Unauthorized callback.", 401);
  }

  let body: DarajaCallbackBody;
  try {
    body = await request.json();
  } catch {
    return callbackError("Callback body is not valid JSON.", 400);
  }

  const callback = body?.Body?.stkCallback;
  if (
    !callback ||
    typeof callback.CheckoutRequestID !== "string" ||
    !callback.CheckoutRequestID ||
    typeof callback.ResultCode !== "number" ||
    !Number.isFinite(callback.ResultCode)
  ) {
    return callbackError("Callback is missing valid payment details.", 400);
  }

  const typeParam = request.nextUrl.searchParams.get("type");
  const id = request.nextUrl.searchParams.get("id");
  const attemptParam = request.nextUrl.searchParams.get("attempt");
  const attempt = attemptParam === null ? undefined : Number(attemptParam);
  const validTypes: PaymentType[] = ["booking", "airport", "wedding", "facilitator"];
  if (
    attemptParam !== null &&
    (!Number.isSafeInteger(attempt) || (attempt ?? 0) < 1)
  ) {
    return callbackError("Callback payment attempt is invalid.", 400);
  }
  if (
    (typeParam !== null || id !== null) &&
    (!typeParam || !validTypes.includes(typeParam as PaymentType) || !id)
  ) {
    return callbackError("Callback payment reference is invalid.", 400);
  }
  const type = typeParam as PaymentType | null;

  try {
    if (type && id && validTypes.includes(type)) {
      await processCallback(type, id, callback, attempt);
    } else {
      await findLegacyPayment(callback);
    }
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("[mpesa/callback] Could not persist payment callback:", error);
    return callbackError(
      "Payment status could not be saved. Safaricom may retry this callback.",
    );
  }
}
