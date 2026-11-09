-- Airport pickup requests and editable airport-to-destination fares.
-- Run this file in the Supabase SQL editor before deploying the application changes.

create table if not exists public.airport_pickup_rates (
  id uuid primary key default gen_random_uuid(),
  airport_code text not null,
  airport_name text not null,
  destination text not null,
  fare_amount integer not null check (fare_amount > 0),
  currency text not null default 'KES' check (currency = 'KES'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (airport_code, destination)
);

create table if not exists public.airport_pickups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  rate_id uuid not null references public.airport_pickup_rates(id) on delete restrict,
  airport_code text not null,
  airport_name text not null,
  destination text not null,
  fare_amount integer not null check (fare_amount > 0),
  currency text not null default 'KES' check (currency = 'KES'),
  arrival_at timestamptz not null,
  flight_number text not null,
  passenger_count smallint not null check (passenger_count between 1 and 30),
  luggage_count smallint not null default 0 check (luggage_count between 0 and 50),
  contact_phone text not null,
  customer_notes text,
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment',
      'payment_failed',
      'requested',
      'accepted',
      'in_progress',
      'completed',
      'rejected',
      'cancelled'
    )),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  checkout_request_id text unique,
  mpesa_receipt_number text,
  mpesa_transaction_date text,
  mpesa_phone text,
  paid_amount integer,
  payment_failure_reason text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists airport_pickups_customer_created_idx
  on public.airport_pickups (customer_id, created_at desc);
create index if not exists airport_pickups_status_created_idx
  on public.airport_pickups (status, created_at desc);

create or replace function public.is_airport_pickup_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('super_admin', 'facilitator')
  );
$$;

create or replace function public.is_airport_pickup_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_airport_pickup_staff() from public, anon;
revoke all on function public.is_airport_pickup_admin() from public, anon;
grant execute on function public.is_airport_pickup_staff() to authenticated;
grant execute on function public.is_airport_pickup_admin() to authenticated;
grant execute on function public.is_airport_pickup_staff() to anon;

alter table public.airport_pickup_rates enable row level security;
alter table public.airport_pickups enable row level security;

drop policy if exists "Active airport pickup rates are readable" on public.airport_pickup_rates;
create policy "Active airport pickup rates are readable"
  on public.airport_pickup_rates
  for select
  to anon, authenticated
  using (is_active or (select public.is_airport_pickup_staff()));

drop policy if exists "Super admins manage airport pickup rates" on public.airport_pickup_rates;
create policy "Super admins manage airport pickup rates"
  on public.airport_pickup_rates
  for all
  to authenticated
  using ((select public.is_airport_pickup_admin()))
  with check ((select public.is_airport_pickup_admin()));

drop policy if exists "Customers and staff read airport pickups" on public.airport_pickups;
create policy "Customers and staff read airport pickups"
  on public.airport_pickups
  for select
  to authenticated
  using (
    customer_id = (select auth.uid())
    or (select public.is_airport_pickup_staff())
  );

drop policy if exists "Customers create their own airport pickups" on public.airport_pickups;
create policy "Customers create their own airport pickups"
  on public.airport_pickups
  for insert
  to authenticated
  with check (
    customer_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.role = 'customer'
    )
    and status = 'pending_payment'
    and payment_status = 'pending'
    and exists (
      select 1
      from public.airport_pickup_rates rate
      where rate.id = rate_id
        and rate.is_active
        and rate.airport_code = airport_code
        and rate.airport_name = airport_name
        and rate.destination = destination
        and rate.fare_amount = airport_pickups.fare_amount
        and rate.currency = airport_pickups.currency
    )
  );

drop policy if exists "Staff update airport pickup status" on public.airport_pickups;
create policy "Staff update airport pickup status"
  on public.airport_pickups
  for update
  to authenticated
  using ((select public.is_airport_pickup_staff()))
  with check ((select public.is_airport_pickup_staff()));

grant select on public.airport_pickup_rates to anon, authenticated;
grant insert, update, delete on public.airport_pickup_rates to authenticated;
grant select on public.airport_pickups to authenticated;
revoke insert, update, delete on public.airport_pickups from anon, authenticated;
grant insert (
  customer_id,
  rate_id,
  airport_code,
  airport_name,
  destination,
  fare_amount,
  currency,
  arrival_at,
  flight_number,
  passenger_count,
  luggage_count,
  contact_phone,
  customer_notes,
  status,
  payment_status
) on public.airport_pickups to authenticated;
grant update (status, admin_notes) on public.airport_pickups to authenticated;

create or replace function public.set_airport_pickup_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists airport_pickup_rates_updated_at on public.airport_pickup_rates;
create trigger airport_pickup_rates_updated_at
  before update on public.airport_pickup_rates
  for each row execute function public.set_airport_pickup_updated_at();

drop trigger if exists airport_pickups_updated_at on public.airport_pickups;
create trigger airport_pickups_updated_at
  before update on public.airport_pickups
  for each row execute function public.set_airport_pickup_updated_at();

alter table public.airport_pickups replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Supabase Realtime publication is unavailable.';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'airport_pickups'
  ) then
    execute 'alter publication supabase_realtime add table public.airport_pickups';
  end if;
end;
$$;
