import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/mpesa/admin";
import { settlePayment, type PaymentKind } from "@/lib/mpesa/settle";

export const maxDuration = 60;

const BATCH_SIZE = 50;

/**
 * Background cross-check with Daraja. Settles payments whose customer closed the
 * page before the result arrived. Run it on a schedule (for example every
 * minute). Protected by MPESA_RECONCILE_SECRET so only the scheduler can call it.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.MPESA_RECONCILE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const admin = createAdminClient();
  const sources: { kind: PaymentKind; query: () => PromiseLike<{ data: { id: string }[] | null; error: unknown }> }[] = [
    {
      kind: "booking",
      query: () => admin.from("bookings").select("id").eq("status", "pending").not("checkout_request_id", "is", null).limit(BATCH_SIZE),
    },
    {
      kind: "airport",
      query: () => admin.from("airport_pickups").select("id").eq("payment_status", "pending").not("checkout_request_id", "is", null).limit(BATCH_SIZE),
    },
    {
      kind: "wedding",
      query: () => admin.from("wedding_event_requests").select("id").eq("payment_status", "pending").not("checkout_request_id", "is", null).limit(BATCH_SIZE),
    },
    {
      kind: "facilitator",
      query: () => admin.from("bookings").select("id").eq("additional_fee_status", "pending").not("facilitator_checkout_id", "is", null).limit(BATCH_SIZE),
    },
  ];

  const summary: Record<string, { checked: number; settled: number; errors: number }> = {};
  for (const source of sources) {
    const { data, error } = await source.query();
    if (error) {
      console.error(`[mpesa/reconcile] Could not list ${source.kind} payments:`, error);
      summary[source.kind] = { checked: 0, settled: 0, errors: 1 };
      continue;
    }
    const counts = { checked: 0, settled: 0, errors: 0 };
    for (const row of data ?? []) {
      counts.checked += 1;
      try {
        const outcome = await settlePayment(admin, source.kind, row.id);
        if (outcome.settled) counts.settled += 1;
      } catch (checkError) {
        counts.errors += 1;
        console.error(`[mpesa/reconcile] ${source.kind} ${row.id} could not be checked:`, checkError);
      }
    }
    summary[source.kind] = counts;
  }

  return NextResponse.json({ ok: true, summary });
}
