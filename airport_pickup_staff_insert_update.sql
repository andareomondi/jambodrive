-- Allow any authenticated account to create an airport pickup for itself.
-- Keeps the ownership, initial-payment state, and active-rate checks.
-- Run in the Supabase SQL editor after airport_pickup.sql.

drop policy if exists "Customers create their own airport pickups"
  on public.airport_pickups;
drop policy if exists "Authenticated users create their own airport pickups"
  on public.airport_pickups;

create policy "Authenticated users create their own airport pickups"
  on public.airport_pickups
  for insert
  to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'pending_payment'
    and payment_status = 'pending'
    and exists (
      select 1
      from public.airport_pickup_rates rate
      where rate.id = airport_pickups.rate_id
        and rate.is_active
        and rate.airport_code = airport_pickups.airport_code
        and rate.airport_name = airport_pickups.airport_name
        and rate.destination = airport_pickups.destination
        and rate.fare_amount = airport_pickups.fare_amount
        and rate.currency = airport_pickups.currency
    )
  );

notify pgrst, 'reload schema';
