-- Create dummy master admin user
-- Note: In production, use proper password hashing and secure methods

-- Insert dummy master admin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'masteradmin@company.com',
  '$2a$10$rjOhqZ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4qJ4q', -- password: 'masteradmin123'
  now(),
  now(),
  now(),
  '{"full_name": "Master Administrator"}',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create profile for master admin
INSERT INTO public.profiles (
  id,
  full_name,
  phone
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Master Administrator',
  '+1234567890'
) ON CONFLICT (id) DO NOTHING;

-- Create wallet for master admin
INSERT INTO public.wallets (
  user_id,
  current_balance
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  1000000.00
) ON CONFLICT (user_id) DO NOTHING;

-- Assign master_admin role
INSERT INTO public.user_roles (
  user_id,
  role,
  assigned_by
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'master_admin',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (user_id, role) DO NOTHING;