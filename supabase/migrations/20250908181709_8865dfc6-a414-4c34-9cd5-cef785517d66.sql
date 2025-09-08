-- Fix admin detection function only (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('admin','master_admin')
  );
$$;

-- Create QR bucket if missing (no policy changes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-payment-qr', 'admin-payment-qr', true)
ON CONFLICT (id) DO NOTHING;