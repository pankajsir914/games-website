-- 1) Create admin_payment_methods table
create table if not exists public.admin_payment_methods (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  method_type text not null check (method_type in ('bank', 'upi', 'qr')),
  is_active boolean not null default true,
  -- Bank details
  bank_name text,
  account_number text,
  ifsc_code text,
  account_holder_name text,
  -- UPI details
  upi_id text,
  -- QR details
  qr_code_url text,
  qr_code_type text,
  nickname text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful index
create index if not exists idx_admin_payment_methods_admin on public.admin_payment_methods(admin_id);

-- Enable RLS
alter table public.admin_payment_methods enable row level security;

-- Drop existing policies if they exist and recreate
drop policy if exists "Admins manage own payment methods" on public.admin_payment_methods;
create policy "Admins manage own payment methods"
  on public.admin_payment_methods
  for all
  to authenticated
  using (is_admin_user(auth.uid()) and admin_id = auth.uid())
  with check (is_admin_user(auth.uid()) and admin_id = auth.uid());

drop policy if exists "Users view creator admin payment methods" on public.admin_payment_methods;
create policy "Users view creator admin payment methods"
  on public.admin_payment_methods
  for select
  to authenticated
  using (
    is_active
    and admin_id = (select created_by from public.profiles where id = auth.uid())
  );

-- 2) Alter payment_requests to link to admin and specific method
alter table public.payment_requests
  add column if not exists admin_id uuid,
  add column if not exists payment_method_id uuid;

create index if not exists idx_payment_requests_admin on public.payment_requests(admin_id);
create index if not exists idx_payment_requests_method on public.payment_requests(payment_method_id);

-- Drop existing policies and recreate
drop policy if exists "Admins view assigned payment requests" on public.payment_requests;
create policy "Admins view assigned payment requests"
  on public.payment_requests
  for select
  to authenticated
  using (is_admin_user(auth.uid()) and admin_id = auth.uid());

drop policy if exists "Admins update assigned payment requests" on public.payment_requests;
create policy "Admins update assigned payment requests"
  on public.payment_requests
  for update
  to authenticated
  using (is_admin_user(auth.uid()) and admin_id = auth.uid())
  with check (is_admin_user(auth.uid()) and admin_id = auth.uid());

-- 3) Function to get creator admin payment methods for current user
create or replace function public.get_admin_payment_methods_for_user()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_methods jsonb;
begin
  -- find the admin who created this user
  select created_by into v_admin_id from public.profiles where id = auth.uid();

  if v_admin_id is null then
    return jsonb_build_object('admin_id', null, 'payment_methods', '[]'::jsonb);
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', id,
    'method_type', method_type,
    'bank_name', bank_name,
    'account_number', account_number,
    'ifsc_code', ifsc_code,
    'account_holder_name', account_holder_name,
    'upi_id', upi_id,
    'qr_code_url', qr_code_url,
    'qr_code_type', qr_code_type,
    'nickname', nickname,
    'is_primary', is_primary
  ) order by is_primary desc, created_at asc) into v_methods
  from public.admin_payment_methods
  where admin_id = v_admin_id and is_active = true;

  return jsonb_build_object(
    'admin_id', v_admin_id,
    'payment_methods', coalesce(v_methods, '[]'::jsonb)
  );
end;
$$;