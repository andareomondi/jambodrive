-- Resend-prompt guard: how many times a customer has asked for a fresh STK prompt,
-- and when the last one was sent. Used to rate-limit /api/mpesa/resend.
alter table public.bookings
  add column if not exists mpesa_resend_count integer not null default 0,
  add column if not exists mpesa_last_push_at timestamptz;

alter table public.airport_pickups
  add column if not exists mpesa_resend_count integer not null default 0,
  add column if not exists mpesa_last_push_at timestamptz;
