-- Create function to set up an admin user by email (assign role, ensure profile and wallet)
-- Uses SECURITY DEFINER with fixed search_path for safety
create or replace function public.setup_admin_user(user_email text, full_name text, phone text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  target_user_id uuid;
begin
  -- Only master admins can set up admin users
  if not has_admin_role(auth.uid(), 'master_admin') then
    raise exception 'Only master admins can set up admin users';
  end if;

  -- Find user by email in auth
  select id into target_user_id
  from auth.users
  where email = user_email;

  if target_user_id is null then
    raise exception 'User with email % not found', user_email;
  end if;

  -- Ensure profile exists
  insert into public.profiles (id, full_name, phone)
  values (target_user_id, full_name, phone)
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    phone = coalesce(excluded.phone, profiles.phone),
    updated_at = now();

  -- Ensure wallet exists
  insert into public.wallets (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  -- Assign admin role
  insert into public.user_roles (user_id, role, assigned_by)
  values (target_user_id, 'admin', auth.uid())
  on conflict (user_id, role) do nothing;

  -- Log activity
  perform public.log_admin_activity(
    'create_admin_user',
    'user',
    target_user_id,
    jsonb_build_object(
      'email', user_email,
      'full_name', full_name,
      'created_by_master_admin', auth.uid()
    )
  );

  return jsonb_build_object('success', true, 'user_id', target_user_id);
end;
$$;