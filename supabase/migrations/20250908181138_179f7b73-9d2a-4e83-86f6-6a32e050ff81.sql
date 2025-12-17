-- 1) Ensure robust admin detection
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

-- 2) Admin payment methods table (for admins to provide deposit/withdraw details)
CREATE TABLE IF NOT EXISTS public.admin_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('bank','upi','qr')),
  bank_name text,
  account_number text,
  ifsc_code text,
  account_holder_name text,
  upi_id text,
  qr_code_url text,
  qr_code_type text,
  nickname text,
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_payment_methods_admin_id ON public.admin_payment_methods(admin_id);

ALTER TABLE public.admin_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_payment_methods
CREATE POLICY "Admins can view their own admin payment methods"
ON public.admin_payment_methods
FOR SELECT
USING (auth.uid() = admin_id OR has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can insert their own admin payment methods"
ON public.admin_payment_methods
FOR INSERT
WITH CHECK (auth.uid() = admin_id OR has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can update their own admin payment methods"
ON public.admin_payment_methods
FOR UPDATE
USING (auth.uid() = admin_id OR has_admin_role(auth.uid(), 'master_admin'))
WITH CHECK (auth.uid() = admin_id OR has_admin_role(auth.uid(), 'master_admin'));

CREATE POLICY "Admins can delete their own admin payment methods"
ON public.admin_payment_methods
FOR DELETE
USING (auth.uid() = admin_id OR has_admin_role(auth.uid(), 'master_admin'));

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_admin_payment_methods_updated_at ON public.admin_payment_methods;
CREATE TRIGGER trg_update_admin_payment_methods_updated_at
BEFORE UPDATE ON public.admin_payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one primary per admin
CREATE OR REPLACE FUNCTION public.ensure_single_primary_admin_pm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.admin_payment_methods
    SET is_primary = false
    WHERE admin_id = NEW.admin_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_single_primary_admin_pm ON public.admin_payment_methods;
CREATE TRIGGER trg_ensure_single_primary_admin_pm
BEFORE INSERT OR UPDATE ON public.admin_payment_methods
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_admin_pm();

-- 3) Storage bucket for QR codes (just create the bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-payment-qr', 'admin-payment-qr', true)
ON CONFLICT (id) DO NOTHING;