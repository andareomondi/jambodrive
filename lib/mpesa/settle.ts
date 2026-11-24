import type { SupabaseClient } from "@supabase/supabase-js";
import { queryStkPush } from "@/lib/mpesa/daraja";
import { sendBookingReceipt, sendPickupReceipt } from "@/lib/email/receipts";

export type PaymentKind = "booking" | "airport" | "wedding" | "facilitator";

export interface SettleOutcome {
  /** Status in the same vocabulary the client hook compares against. */
  status: string;
  pending: boolean;
  reason: string | null;
  receiptNumber: string | null;
  amount: number | null;
  /** True when this call changed the record, so receipts and side effects ran here. */
  settled: boolean;
}

interface Target {
  table: "bookings" | "airport_pickups" | "wedding_event_requests";
  statusColumn: string;
  checkoutColumn: string;
  amountColumn: string;
  select: string;
}

const TARGETS: Record<PaymentKind, Target> = {
  booking: {
    table: "bookings",
    statusColumn: "status",
    checkoutColumn: "checkout_request_id",
    amountColumn: "total_price",
    select: "id, status, total_price, checkout_request_id, car_id",
  },
  airport: {
    table: "airport_pickups",
    statusColumn: "payment_status",
    checkoutColumn: "checkout_request_id",
    amountColumn: "fare_amount",
    select: "id, payment_status, fare_amount, checkout_request_id",
  },
  wedding: {
    table: "wedding_event_requests",
    statusColumn: "payment_status",
    checkoutColumn: "checkout_request_id",
    amountColumn: "quote_amount",
    select: "id, payment_status, quote_amount, payment_attempts, checkout_request_id",
  },
  facilitator: {
    table: "bookings",
    statusColumn: "additional_fee_status",
    checkoutColumn: "facilitator_checkout_id",
    amountColumn: "additional_fee_amount",
    select: "id, additional_fee_status, additional_fee_amount, facilitator_checkout_id",
  },
};

/**
 * Checks one payment with Daraja and records the result. Used by the status
 * route (when the customer is watching) and by the reconciler (when nobody is).
 * The update is guarded on the current status, so two checks can never both
 * settle the same payment or send two receipts.
 */
export async function settlePayment(
  admin: SupabaseClient,
  kind: PaymentKind,
  id: string,
): Promise<SettleOutcome> {
  const target = TARGETS[kind];
  const { data: row, error } = await admin
    .from(target.table)
    .select(target.select)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error("Payment record not found.");

  const r = row as unknown as Record<string, unknown>;
  const currentStatus = String(r[target.statusColumn] ?? "pending");
  const checkoutId = (r[target.checkoutColumn] as string | null) ?? null;
  const pending = currentStatus === "pending";
  const expectedAmount = Math.ceil(Number(r[target.amountColumn] ?? 0));

  const unchanged = (): SettleOutcome => ({
    status: currentStatus,
    pending,
    reason: null,
    receiptNumber: null,
    amount: null,
    settled: false,
  });

  if (!pending || !checkoutId) return unchanged();

  // DarajaUnavailableError propagates: the caller reports "still checking", never a failure.
  const query = await queryStkPush(checkoutId, expectedAmount);
  if (query.state === "pending") return unchanged();

  const paid = query.state === "paid";
  const reason = query.state === "failed" ? query.reason : null;
  const receiptNumber = query.state === "paid" ? query.receiptNumber : null;
  const transactionDate = query.state === "paid" ? query.transactionDate : null;
  const amount = query.state === "paid" ? query.amount : null;

  let updates: Record<string, unknown>;
  let nextStatus: string;
  if (kind === "booking") {
    nextStatus = paid ? "confirmed" : "failed";
    updates = paid
      ? { status: "confirmed", mpesa_receipt_number: receiptNumber, mpesa_transaction_date: transactionDate, paid_amount: amount, payment_failure_reason: null }
      : { status: "failed", payment_failure_reason: reason };
  } else if (kind === "airport") {
    nextStatus = paid ? "paid" : "failed";
    updates = paid
      ? { status: "requested", payment_status: "paid", mpesa_receipt_number: receiptNumber, mpesa_transaction_date: transactionDate, paid_amount: amount, payment_failure_reason: null }
      : { status: "payment_failed", payment_status: "failed", payment_failure_reason: reason };
  } else if (kind === "wedding") {
    nextStatus = paid ? "paid" : "failed";
    const attempts = Number(r.payment_attempts ?? 0);
    updates = paid
      ? { status: "confirmed", payment_status: "paid", mpesa_receipt_number: receiptNumber, mpesa_transaction_date: transactionDate, paid_amount: amount, payment_failure_reason: null }
      : { ...(attempts >= 3 ? { status: "spam" } : {}), payment_status: "failed", payment_failure_reason: reason };
  } else {
    nextStatus = paid ? "confirmed" : "failed";
    updates = paid
      ? { additional_fee_status: "confirmed", additional_fee_receipt: receiptNumber, additional_fee_amount: amount, additional_fee_reason: null }
      : { additional_fee_status: "failed", additional_fee_reason: reason };
  }

  const { data: changed, error: updateError } = await admin
    .from(target.table)
    .update(updates)
    .eq("id", id)
    .eq(target.statusColumn, currentStatus)
    .select("id");
  if (updateError) throw updateError;

  if (!changed?.length) {
    // Another check or the callback settled it first. Report what is now stored.
    const { data: latest } = await admin
      .from(target.table)
      .select(target.statusColumn)
      .eq("id", id)
      .maybeSingle();
    const latestStatus = String((latest as Record<string, unknown> | null)?.[target.statusColumn] ?? nextStatus);
    return { ...unchanged(), status: latestStatus, pending: latestStatus === "pending", settled: false };
  }

  if (kind === "booking" && paid && r.car_id) {
    const { error: carError } = await admin.from("cars").update({ available: false }).eq("id", r.car_id);
    if (carError) console.error("[mpesa/settle] Could not mark car unavailable:", carError);
  }

  if (paid) {
    try {
      if (kind === "booking") await sendBookingReceipt(admin, id);
      if (kind === "airport") await sendPickupReceipt(admin, id);
    } catch (emailError) {
      console.error(`[mpesa/settle] Payment saved for ${kind} ${id}, but the receipt email failed:`, emailError);
    }
  }

  return {
    status: nextStatus,
    pending: false,
    reason,
    receiptNumber,
    amount,
    settled: true,
  };
}
