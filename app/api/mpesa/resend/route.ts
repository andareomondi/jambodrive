import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/mpesa/admin";
import { settlePayment, type PaymentKind } from "@/lib/mpesa/settle";

const RESEND_COOLDOWN_MS = 60_000;
const MAX_RESENDS = 3;

type ResendKind = Extract<PaymentKind, "booking" | "airport" | "wedding">;

interface ResendConfig {
  table: "bookings" | "airport_pickups" | "wedding_event_requests";
  bodyKey: "bookingId" | "airportPickupId" | "weddingEventRequestId";
  ownerColumn: "profile_id" | "customer_id";
  statusColumn: string;
  failedValue: string;
  select: string;
  /** Fields set back to the values the STK push route expects before a new request. */
  reset: Record<string, unknown>;
  /** Booking and airport records keep a count and cooldown. Wedding uses payment_attempts. */
  hasResendFields: boolean;
}

const CONFIG: Record<ResendKind, ResendConfig> = {
  booking: {
    table: "bookings",
    bodyKey: "bookingId",
    ownerColumn: "profile_id",
    statusColumn: "status",
    failedValue: "failed",
    select:
      "id, profile_id, status, checkout_request_id, payment_failure_reason, mpesa_resend_count, mpesa_last_push_at",
    reset: { status: "pending", checkout_request_id: null, payment_failure_reason: null },
    hasResendFields: true,
  },
  airport: {
    table: "airport_pickups",
    bodyKey: "airportPickupId",
    ownerColumn: "customer_id",
    statusColumn: "payment_status",
    failedValue: "failed",
    select:
      "id, customer_id, status, payment_status, checkout_request_id, payment_failure_reason, mpesa_resend_count, mpesa_last_push_at",
    reset: {
      status: "pending_payment",
      payment_status: "pending",
      checkout_request_id: null,
      payment_failure_reason: null,
    },
    hasResendFields: true,
  },
  wedding: {
    table: "wedding_event_requests",
    bodyKey: "weddingEventRequestId",
    ownerColumn: "customer_id",
    statusColumn: "payment_status",
    failedValue: "failed",
    select:
      "id, customer_id, status, payment_status, checkout_request_id, payment_failure_reason, payment_attempts",
    reset: { payment_status: "pending", checkout_request_id: null, payment_failure_reason: null },
    hasResendFields: false,
  },
};

/**
 * Sends a fresh STK prompt for a payment whose previous prompt has ended.
 * It never sends a second prompt while the old one may still be open:
 *  - an open checkout is checked with Daraja first; paid settles, pending blocks;
 *  - no checkout id and not yet failed blocks, because the earlier request may still arrive;
 *  - limited to MAX_RESENDS per payment and one request per RESEND_COOLDOWN_MS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kind = body?.type as ResendKind;
    const id = body?.id;
    const phone = body?.phone;
    if (!(kind in CONFIG) || typeof id !== "string" || !id) {
      return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
    }
    if (typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json({ error: "A phone number is required." }, { status: 400 });
    }
    const config = CONFIG[kind];

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to request a new prompt." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: found, error: findError } = await admin
      .from(config.table)
      .select(config.select)
      .eq("id", id)
      .maybeSingle();
    if (findError) throw findError;
    if (!found) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    const row = found as unknown as Record<string, unknown>;

    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (row[config.ownerColumn] !== user.id && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Not authorized to request a new prompt." }, { status: 403 });
    }

    // 1. Make sure the previous prompt has ended.
    const checkoutId = row.checkout_request_id as string | null;
    if (checkoutId) {
      const outcome = await settlePayment(admin, kind, id);
      if (outcome.pending) {
        return NextResponse.json(
          {
            state: "open",
            error:
              "The previous M-Pesa prompt may still be open. Approve it on your phone, or wait a few minutes before requesting another.",
          },
          { status: 409 },
        );
      }
      if (outcome.status !== config.failedValue) {
        return NextResponse.json({ state: "paid", status: outcome.status });
      }
    } else if (String(row[config.statusColumn]) !== config.failedValue) {
      return NextResponse.json(
        {
          state: "open",
          error: "A previous request may still be processing. Wait a few minutes before requesting another prompt.",
        },
        { status: 409 },
      );
    }

    // 2. Rate limits.
    if (config.hasResendFields) {
      const count = Number(row.mpesa_resend_count ?? 0);
      if (count >= MAX_RESENDS) {
        return NextResponse.json(
          { error: "You have used all prompt resends for this payment. Contact support." },
          { status: 429 },
        );
      }
      const lastPush = row.mpesa_last_push_at ? Date.parse(String(row.mpesa_last_push_at)) : 0;
      if (lastPush && Date.now() - lastPush < RESEND_COOLDOWN_MS) {
        return NextResponse.json(
          { error: "Please wait a minute before requesting another prompt." },
          { status: 429 },
        );
      }
    } else if (Number(row.payment_attempts ?? 0) >= MAX_RESENDS) {
      return NextResponse.json(
        { error: "You have used all prompt attempts for this quote. Contact support." },
        { status: 429 },
      );
    }

    // 3. Reset the record, guarded so two resend clicks cannot both start a prompt.
    const update: Record<string, unknown> = { ...config.reset };
    if (config.hasResendFields) {
      update.mpesa_resend_count = Number(row.mpesa_resend_count ?? 0) + 1;
      update.mpesa_last_push_at = new Date().toISOString();
    }
    const { data: reset, error: resetError } = await admin
      .from(config.table)
      .update(update)
      .eq("id", id)
      .eq(config.statusColumn, config.failedValue)
      .select("id");
    if (resetError) throw resetError;
    if (!reset || reset.length === 0) {
      return NextResponse.json(
        { state: "open", error: "A new prompt is already being prepared. Please wait." },
        { status: 409 },
      );
    }

    // 4. Send the prompt through the normal STK push route, with the caller's session.
    const stkResponse = await fetch(new URL("/api/mpesa/stkpush", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({ [config.bodyKey]: id, phone }),
      cache: "no-store",
    });
    const text = await stkResponse.text();
    let stkBody: { error?: string } = {};
    try {
      stkBody = JSON.parse(text);
    } catch {
      stkBody = { error: "The payment service returned an unreadable response." };
    }
    if (!stkResponse.ok) {
      return NextResponse.json(
        { state: "failed", error: stkBody.error ?? "Could not send a new prompt." },
        { status: stkResponse.status },
      );
    }
    return NextResponse.json({ state: "sent" });
  } catch (error) {
    console.error("[mpesa/resend] Could not resend the prompt:", error);
    return NextResponse.json(
      { error: "Could not request a new prompt. Please try again." },
      { status: 500 },
    );
  }
}
