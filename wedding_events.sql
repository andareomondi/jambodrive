-- Wedding event transport enquiries.
-- Run this file in the Supabase SQL editor before deploying the application changes.
-- Re-run it after deployment to apply customer tracking to an existing table.

create table if not exists public.wedding_event_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  contact_email text not null check (char_length(trim(contact_email)) between 5 and 254),
  contact_phone text not null check (char_length(trim(contact_phone)) between 9 and 20),
  event_date date not null,
  budget_min integer not null check (budget_min > 0),
  budget_max integer not null check (budget_max >= budget_min),
  car_count smallint not null check (car_count between 1 and 30),
  preferred_car_types text[] not null default '{}'
    check (cardinality(preferred_car_types) <= 8),
  color_scheme text not null check (char_length(trim(color_scheme)) between 2 and 120),
  sample_car_ids uuid[] not null default '{}'
    check (cardinality(sample_car_ids) <= 12),
  venue text check (venue is null or char_length(venue) <= 200),
  notes text check (notes is null or char_length(notes) <= 1500),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'quoted', 'confirmed', 'cancelled', 'spam')),
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 2000),
  quote_amount integer check (quote_amount is null or quote_amount > 0),
  quote_notes text check (quote_notes is null or char_length(quote_notes) <= 2000),
  contact_method text check (contact_method is null or contact_method in ('email', 'whatsapp', 'call')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'partial', 'paid', 'failed')),
  checkout_request_id text,
  mpesa_receipt_number text,
  mpesa_transaction_date text,
  mpesa_phone text,
  paid_amount numeric(12, 2),
  payment_failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wedding_event_requests
  add column if not exists customer_id uuid references public.profiles(id) on delete set null;
alter table public.wedding_event_requests
  add column if not exists quote_amount integer,
  add column if not exists quote_notes text,
  add column if not exists contact_method text,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists checkout_request_id text,
  add column if not exists mpesa_receipt_number text,
  add column if not exists mpesa_transaction_date text,
  add column if not exists mpesa_phone text,
  add column if not exists paid_amount numeric(12, 2),
  add column if not exists payment_failure_reason text;

alter table public.wedding_event_requests
  drop constraint if exists wedding_event_requests_status_check;
update public.wedding_event_requests
set status = 'cancelled'
where status = 'declined';
alter table public.wedding_event_requests
  add constraint wedding_event_requests_status_check
  check (status in ('new', 'contacted', 'quoted', 'confirmed', 'cancelled', 'spam'));
alter table public.wedding_event_requests
  drop constraint if exists wedding_event_requests_payment_status_check;
alter table public.wedding_event_requests
  add constraint wedding_event_requests_payment_status_check
  check (payment_status in ('unpaid', 'pending', 'partial', 'paid', 'failed'));
alter table public.wedding_event_requests
  drop constraint if exists wedding_event_requests_quote_amount_check;
alter table public.wedding_event_requests
  add constraint wedding_event_requests_quote_amount_check
  check (quote_amount is null or quote_amount > 0);
alter table public.wedding_event_requests
  drop constraint if exists wedding_event_requests_contact_method_check;
alter table public.wedding_event_requests
  add constraint wedding_event_requests_contact_method_check
  check (contact_method is null or contact_method in ('email', 'whatsapp', 'call'));

create index if not exists wedding_event_requests_status_created_idx
  on public.wedding_event_requests (status, created_at desc);
create index if not exists wedding_event_requests_event_date_idx
  on public.wedding_event_requests (event_date);
create index if not exists wedding_event_requests_customer_created_idx
  on public.wedding_event_requests (customer_id, created_at desc)
  where customer_id is not null;

create or replace function public.is_wedding_event_admin()
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

revoke all on function public.is_wedding_event_admin() from public, anon;
grant execute on function public.is_wedding_event_admin() to authenticated;

create or replace function public.set_wedding_event_request_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
      (old.status = 'new' and new.status in ('contacted', 'cancelled', 'spam'))
      or (
        old.status = 'contacted'
        and new.status = 'quoted'
        and new.quote_amount is not null
      )
      or (
        old.status = 'quoted'
        and new.status = 'confirmed'
        and new.payment_status = 'paid'
      )
    ) then
      raise exception 'Wedding enquiry status must follow the payment workflow.';
    end if;
  end if;

  if new.status = 'quoted' and (new.quote_amount is null or new.quote_amount < 1) then
    raise exception 'A valid quote amount is required before sending a quote.';
  end if;

  return new;
end;
$$;

drop trigger if exists wedding_event_requests_updated_at
  on public.wedding_event_requests;
create trigger wedding_event_requests_updated_at
  before update on public.wedding_event_requests
  for each row execute function public.set_wedding_event_request_updated_at();

drop trigger if exists wedding_event_requests_progress_guard
  on public.wedding_event_requests;
create trigger wedding_event_requests_progress_guard
  before update on public.wedding_event_requests
  for each row execute function public.enforce_wedding_event_request_progress();

alter table public.wedding_event_requests enable row level security;

drop policy if exists "Public can submit wedding event enquiries"
  on public.wedding_event_requests;
create policy "Public can submit wedding event enquiries"
  on public.wedding_event_requests
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and admin_notes is null
    and quote_amount is null
    and quote_notes is null
    and contact_method is null
    and payment_status = 'unpaid'
    and checkout_request_id is null
    and mpesa_receipt_number is null
    and paid_amount is null
    and (
      ((select auth.uid()) is null and customer_id is null)
      or (
        (select auth.uid()) is not null
        and customer_id = (select auth.uid())
      )
    )
    and budget_max >= budget_min
    and event_date > current_date
    and preferred_car_types <@ array[
      'Premium',
      'Executive',
      'Luxury SUV',
      'Classic',
      'Convertible',
      'Vans',
      'Other'
    ]::text[]
  );

drop policy if exists "Super admins read wedding event enquiries"
  on public.wedding_event_requests;
create policy "Super admins read wedding event enquiries"
  on public.wedding_event_requests
  for select
  to authenticated
  using ((select public.is_wedding_event_admin()));

drop policy if exists "Customers read their own wedding event enquiries"
  on public.wedding_event_requests;
create policy "Customers read their own wedding event enquiries"
  on public.wedding_event_requests
  for select
  to authenticated
  using (customer_id = (select auth.uid()));

drop policy if exists "Super admins update wedding event enquiries"
  on public.wedding_event_requests;
create policy "Super admins update wedding event enquiries"
  on public.wedding_event_requests
  for update
  to authenticated
  using ((select public.is_wedding_event_admin()))
  with check ((select public.is_wedding_event_admin()));

revoke all on public.wedding_event_requests from public, anon, authenticated;
grant insert on public.wedding_event_requests to anon, authenticated;
grant select on public.wedding_event_requests to authenticated;
grant update (
  status,
  admin_notes,
  quote_amount,
  quote_notes,
  contact_method,
  payment_status,
  checkout_request_id,
  mpesa_receipt_number,
  mpesa_transaction_date,
  mpesa_phone,
  paid_amount,
  payment_failure_reason
) on public.wedding_event_requests to authenticated;

alter table public.wedding_event_requests replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'wedding_event_requests'
     ) then
    execute 'alter publication supabase_realtime add table public.wedding_event_requests';
  end if;
end;
$$;

notify pgrst, 'reload schema';
