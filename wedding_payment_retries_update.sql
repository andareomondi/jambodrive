-- Add a three-attempt limit and workflow guard to existing wedding quotes.
-- Run after wedding_events_update.sql in the Supabase SQL editor.
-- Safe to re-run.

alter table public.wedding_event_requests
  add column if not exists payment_attempts smallint not null default 0;

alter table public.wedding_event_requests
  drop constraint if exists wedding_event_requests_payment_attempts_check;
alter table public.wedding_event_requests
  add constraint wedding_event_requests_payment_attempts_check
  check (payment_attempts between 0 and 3);

-- A pending row with no checkout ID cannot receive a callback; allow the
-- customer to retry rather than leaving it permanently stuck.
update public.wedding_event_requests
set payment_status = 'failed',
    payment_failure_reason = coalesce(
      payment_failure_reason,
      'The previous M-Pesa request could not be tracked. Please retry payment.'
    )
where status = 'quoted'
  and payment_status = 'pending'
  and checkout_request_id is null;

create or replace function public.reserve_wedding_event_payment(
  p_request_id uuid,
  p_phone text
)
returns smallint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_attempt smallint;
  request_customer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to request quote payment.';
  end if;

  select customer_id into request_customer_id
  from public.wedding_event_requests
  where id = p_request_id;

  if not found then
    raise exception 'Wedding quote not found.';
  end if;

  if request_customer_id is distinct from auth.uid()
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and role = 'super_admin'
     ) then
    raise exception 'Not authorized to request payment for this quote.';
  end if;

  update public.wedding_event_requests
  set payment_attempts = payment_attempts + 1,
      payment_status = 'pending',
      mpesa_phone = p_phone,
      payment_failure_reason = null,
      checkout_request_id = null
  where id = p_request_id
    and status = 'quoted'
    and payment_status in ('unpaid', 'failed')
    and payment_attempts < 3
    and coalesce(paid_amount, 0) = 0
  returning payment_attempts into next_attempt;

  if next_attempt is null then
    raise exception 'Payment is already pending, has already been paid, or the three-attempt limit has been reached.';
  end if;

  return next_attempt;
end;
$$;

revoke all on function public.reserve_wedding_event_payment(uuid, text)
  from public, anon;
grant execute on function public.reserve_wedding_event_payment(uuid, text)
  to authenticated;

create or replace function public.enforce_wedding_event_request_progress()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    if old.status in ('confirmed', 'cancelled', 'spam') then
      raise exception 'This wedding enquiry is locked.';
    end if;

    if not (
      (
        old.status = 'new'
        and new.status = 'contacted'
        and new.contact_method in ('email', 'whatsapp', 'call')
      )
      or (
        old.status = 'new'
        and new.status in ('cancelled', 'spam')
      )
      or (
        old.status = 'contacted'
        and new.status = 'quoted'
        and new.quote_amount is not null
      )
      or (
        old.status = 'quoted'
        and new.status = 'confirmed'
        and new.payment_status = 'paid'
        and new.paid_amount = new.quote_amount
      )
      or (
        old.status = 'quoted'
        and new.status = 'spam'
        and new.payment_status = 'failed'
        and new.payment_attempts >= 3
      )
    ) then
      raise exception 'Wedding enquiry status must follow the payment workflow.';
    end if;
  end if;

  if new.status = 'quoted'
     and (new.quote_amount is null or new.quote_amount < 1) then
    raise exception 'A valid quote amount is required before sending a quote.';
  end if;
  if new.payment_attempts < old.payment_attempts
     or new.payment_attempts > 3 then
    raise exception 'Wedding payment attempts cannot be reduced or exceed three.';
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
