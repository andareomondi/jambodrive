import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Admin Client ────────────────────────────────────────────────────

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
);
// ─── Types ───────────────────────────────────────────────────────────────────

interface CallbackItem {
  Name: string;
  Value: string | number;
}

interface StkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: CallbackItem[];
  };
}

interface DarajaCallbackBody {
  Body: {
    stkCallback: StkCallback;
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function findItem(items: CallbackItem[], name: string) {
  return items.find((i) => i.Name === name)?.Value ?? null;
}

// ─── Safaricom IP Whitelist ───────────────────────────────────────────────────
// Safaricom sends callbacks only from these ranges in production.
// Comment this out during sandbox testing — sandbox IPs are not whitelisted.
const SAFARICOM_IPS = [
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.44",
  "196.201.212.127",
  "196.201.212.138",
  "196.201.212.129",
  "196.201.212.136",
  "196.201.212.74",
  "196.201.212.69",
];

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { secret: string } },
) {
  // ── 1. Verify the secret appended to the URL ────────────────────────────
  if (params.secret !== process.env.MPESA_CALLBACK_SECRET) {
    console.warn("[mpesa/callback] Invalid secret in callback URL.");
    // Return 200 anyway — Safaricom retries on non-2xx, which wastes quota
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // ── 2. (Optional) IP whitelist — uncomment for production ───────────────
  // const clientIp =
  //   req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "";
  // if (!SAFARICOM_IPS.includes(clientIp)) {
  //   console.warn("[mpesa/callback] Blocked request from IP:", clientIp);
  //   return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  // }

  let body: DarajaCallbackBody;

  try {
    body = await req.json();
  } catch {
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

  // ── 3. Find the booking tied to this CheckoutRequestID ──────────────────
  const { data: booking, error: findError } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("checkout_request_id", CheckoutRequestID)
    .single();

  if (findError || !booking) {
    console.error(
      "[mpesa/callback] No booking found for CheckoutRequestID:",
      CheckoutRequestID,
      findError,
    );
    // Still return 200 to Safaricom — don't let them retry
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // ── 4. Handle success vs failure ────────────────────────────────────────
  if (ResultCode === 0 && CallbackMetadata) {
    // Payment successful — extract receipt details
    const items = CallbackMetadata.Item;
    const mpesaReceiptNumber = findItem(items, "MpesaReceiptNumber");
    const transactionDate = findItem(items, "TransactionDate");
    const phoneNumber = String(findItem(items, "PhoneNumber") ?? "");
    const paidAmount = findItem(items, "Amount");

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        mpesa_receipt_number: mpesaReceiptNumber,
        mpesa_transaction_date: transactionDate,
        mpesa_phone: phoneNumber,
        paid_amount: paidAmount,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("[mpesa/callback] Failed to confirm booking:", updateError);
    } else {
      console.log(
        `[mpesa/callback] Booking ${booking.id} confirmed. Receipt: ${mpesaReceiptNumber}`,
      );
    }
  } else {
    // Payment failed or cancelled
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "failed",
        payment_failure_reason: ResultDesc,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error(
        "[mpesa/callback] Failed to mark booking as failed:",
        updateError,
      );
    } else {
      console.log(
        `[mpesa/callback] Booking ${booking.id} failed. Reason: ${ResultDesc}`,
      );
    }
  }

  // ── 5. Always respond 200 to Safaricom ──────────────────────────────────
  // If you return anything other than 2xx, Safaricom will retry the callback.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
