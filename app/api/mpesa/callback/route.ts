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
  // ── 1. Validate secret from query param ─────────────────────────────────
  // Callback URL stored in .env is: https://yourdomain.com/api/mpesa/callback?key=YOUR_SECRET
  const key = req.nextUrl.searchParams.get("key");
  if (key !== process.env.MPESA_CALLBACK_SECRET) {
    console.warn("[mpesa/callback] Invalid or missing secret key.");
    // Always 200 — non-2xx causes Safaricom to retry endlessly
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────
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

  // ── 3. Find booking by CheckoutRequestID ────────────────────────────────
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
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  // ── 4. Update booking based on result ────────────────────────────────────
  if (ResultCode === 0 && CallbackMetadata) {
    const items = CallbackMetadata.Item;

    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        mpesa_receipt_number: findItem(items, "MpesaReceiptNumber"),
        mpesa_transaction_date: findItem(items, "TransactionDate"),
        mpesa_phone: String(findItem(items, "PhoneNumber") ?? ""),
        paid_amount: findItem(items, "Amount"),
      })
      .eq("id", booking.id);

    if (error) {
      console.error("[mpesa/callback] Failed to confirm booking:", error);
    } else {
      console.log(`[mpesa/callback] Booking ${booking.id} confirmed.`);
    }
  } else {
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "failed",
        payment_failure_reason: ResultDesc,
      })
      .eq("id", booking.id);

    if (error) {
      console.error("[mpesa/callback] Failed to mark booking failed:", error);
    } else {
      console.log(
        `[mpesa/callback] Booking ${booking.id} failed: ${ResultDesc}`,
      );
    }
  }

  // ── 5. Always respond 200 to Safaricom ──────────────────────────────────
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
