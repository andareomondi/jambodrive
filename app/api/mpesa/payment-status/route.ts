import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/mpesa/admin";
import { settlePayment, type PaymentKind } from "@/lib/mpesa/settle";
import { DarajaUnavailableError } from "@/lib/mpesa/daraja";

const KINDS: PaymentKind[] = ["booking", "airport", "wedding", "facilitator"];

/**
 * Status check used by the payment dialog. Confirms the caller may see the
 * payment, then asks Daraja and records the result. A Daraja outage returns
 * pending, never a failure.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kind = body?.type as PaymentKind;
    const id = body?.id;
    if (!KINDS.includes(kind) || typeof id !== "string" || !id) {
      return NextResponse.json({ error: "A valid payment reference is required." }, { status: 400 });
    }

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to check payment status." }, { status: 401 });
    }

    const admin = createAdminClient();
    const ownerCheck =
      kind === "booking"
        ? await admin.from("bookings").select("profile_id").eq("id", id).maybeSingle()
        : kind === "airport"
          ? await admin.from("airport_pickups").select("customer_id").eq("id", id).maybeSingle()
          : kind === "wedding"
            ? await admin.from("wedding_event_requests").select("customer_id").eq("id", id).maybeSingle()
            : await admin.from("bookings").select("id").eq("id", id).maybeSingle();
    if (ownerCheck.error) throw ownerCheck.error;
    if (!ownerCheck.data) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }

    const owner =
      kind === "booking"
        ? (ownerCheck.data as { profile_id: string | null }).profile_id
        : kind === "airport" || kind === "wedding"
          ? (ownerCheck.data as { customer_id: string | null }).customer_id
          : null;
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = profile?.role ?? "customer";
    const allowed =
      kind === "facilitator"
        ? role === "facilitator" || role === "super_admin"
        : owner === user.id || role === "super_admin";
    if (!allowed) {
      return NextResponse.json({ error: "Not authorized to check this payment." }, { status: 403 });
    }

    const outcome = await settlePayment(admin, kind, id);
    return NextResponse.json({
      status: outcome.status,
      pending: outcome.pending,
      reason: outcome.reason,
      receiptNumber: outcome.receiptNumber,
      amount: outcome.amount,
    });
  } catch (error) {
    if (error instanceof DarajaUnavailableError) {
      // Daraja is not answering properly. Keep the customer waiting; the reconciler will retry.
      console.warn("[mpesa/payment-status]", error.message);
      return NextResponse.json({ status: "pending", pending: true, error: error.message }, { status: 502 });
    }
    console.error("[mpesa/payment-status] Could not check payment status:", error);
    return NextResponse.json(
      { error: "Could not check the M-Pesa payment status.", pending: true },
      { status: 502 },
    );
  }
}
