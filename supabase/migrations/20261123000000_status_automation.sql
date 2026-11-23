-- Keeps stale records from sitting in "active" states forever.
-- Runs inside Supabase (pg_cron), so it needs no separate server or cron host.

create extension if not exists pg_cron with schema extensions;

-- Bookings still pending 30 minutes after they were made, with no M-Pesa
-- receipt, expire as failed. A verified late payment can re-open them (see
-- the M-Pesa callback).
create or replace function public.expire_unpaid_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.bookings
     set status = 'failed',
         payment_failure_reason = 'Payment was never received.'
   where status = 'pending'
     and mpesa_receipt_number is null
     and created_at < now() - interval '30 minutes';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Airport pickups one day past their arrival time:
--   accepted / in progress  -> completed
--   requested, never accepted -> cancelled (an admin note flags any refund)
--   still awaiting payment    -> cancelled
create or replace function public.close_past_airport_pickups()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
  step integer;
begin
  update public.airport_pickups
     set status = 'completed'
   where status in ('accepted', 'in_progress')
     and arrival_at < now() - interval '1 day';
  get diagnostics step = row_count;
  affected := affected + step;

  update public.airport_pickups
     set status = 'cancelled',
         admin_notes = concat_ws(E'\n', nullif(admin_notes, ''),
           case when payment_status = 'paid'
                then 'Expired: arrival passed before the pickup was accepted. Refund may be due.'
                else 'Expired: arrival passed before payment was received.' end)
   where status in ('requested', 'pending_payment')
     and arrival_at < now() - interval '1 day';
  get diagnostics step = row_count;
  affected := affected + step;

  return affected;
end;
$$;

-- Schedule both jobs (replaces any earlier version of the same job).
do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname in ('expire-unpaid-bookings', 'close-past-airport-pickups');
exception when others then
  null;
end $$;

select cron.schedule('expire-unpaid-bookings', '*/5 * * * *', $$select public.expire_unpaid_bookings()$$);
select cron.schedule('close-past-airport-pickups', '*/30 * * * *', $$select public.close_past_airport_pickups()$$);
