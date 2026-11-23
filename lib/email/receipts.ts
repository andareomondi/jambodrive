import type { SupabaseClient } from "@supabase/supabase-js";
import { escapeHtml, sendEmail } from "@/lib/email/resend";
import { surfaceUrl } from "@/lib/routing/surfaces";

/**
 * Payment confirmation emails. Called only after a payment has been verified
 * and recorded, so an email always means money has actually been received.
 * A failed send is logged and never fails the M-Pesa callback: the payment is
 * already saved, and the email can be re-sent from the admin area.
 */

const KES = (amount: number | null | undefined) =>
  `KSh ${Number(amount ?? 0).toLocaleString("en-KE")}`;

function layout(title: string, rows: [string, string][], footer: string) {
  const rowHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#666">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right"><strong>${escapeHtml(value)}</strong></td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;color:#111">${escapeHtml(title)}</h1>
<table style="width:100%;border-collapse:collapse;font-size:14px">${rowHtml}</table>
<p style="margin:24px 0 0;font-size:13px;color:#666">${escapeHtml(footer)}</p>
</div></body></html>`;
  const text = [title, "", ...rows.map(([l, v]) => `${l}: ${v}`), "", footer].join("\n");
  return { html, text };
}

const FOOTER = `Questions? Reply to this email or visit ${surfaceUrl("main", "/contact")}.`;

export async function sendBookingReceipt(supabase: SupabaseClient, bookingId: string) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, pickup_date, return_date, pickup_location, paid_amount, mpesa_receipt_number, profile_id, cars(name), profiles(email, full_name)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking) return;

  const profile = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
  const car = Array.isArray(booking.cars) ? booking.cars[0] : booking.cars;
  if (!profile?.email) return;

  const { html, text } = layout(
    "Your booking is confirmed",
    [
      ["Vehicle", car?.name ?? "Your vehicle"],
      ["Pickup", booking.pickup_date ?? ""],
      ["Return", booking.return_date ?? ""],
      ["Pickup location", booking.pickup_location ?? ""],
      ["Amount paid", KES(booking.paid_amount)],
      ["M-Pesa receipt", booking.mpesa_receipt_number ?? ""],
    ],
    FOOTER,
  );

  await sendEmail({
    idempotencyKey: `booking-receipt:${booking.id}`,
    to: profile.email,
    subject: `Booking confirmed — ${car?.name ?? "Cosmara"}`,
    html,
    text,
  });
}

export async function sendPickupReceipt(supabase: SupabaseClient, pickupId: string) {
  const { data: pickup, error } = await supabase
    .from("airport_pickups")
    .select(
      "id, airport_name, destination, arrival_at, flight_number, paid_amount, mpesa_receipt_number, customer_id",
    )
    .eq("id", pickupId)
    .maybeSingle();
  if (error) throw error;
  if (!pickup) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", pickup.customer_id)
    .maybeSingle();
  if (!profile?.email) return;

  const { html, text } = layout(
    "Your airport pickup is paid",
    [
      ["Airport", pickup.airport_name],
      ["Destination", pickup.destination],
      ["Flight", pickup.flight_number],
      ["Arrival", new Date(pickup.arrival_at).toLocaleString("en-KE")],
      ["Amount paid", KES(pickup.paid_amount)],
      ["M-Pesa receipt", pickup.mpesa_receipt_number ?? ""],
    ],
    FOOTER,
  );

  await sendEmail({
    idempotencyKey: `pickup-receipt:${pickup.id}`,
    to: profile.email,
    subject: "Airport pickup payment received",
    html,
    text,
  });
}

