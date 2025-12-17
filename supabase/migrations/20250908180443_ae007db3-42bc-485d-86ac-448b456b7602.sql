-- Create user_payment_methods table (used by hooks)
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('bank_account','upi')),
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  upi_id TEXT,
  nickname TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own user payment methods"
  ON public.user_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own user payment methods"
  ON public.user_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update their own user payment methods"
  ON public.user_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete their own user payment methods"
  ON public.user_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure single primary per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_upm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.user_payment_methods
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_single_primary_upm ON public.user_payment_methods;
CREATE TRIGGER trg_ensure_single_primary_upm
BEFORE INSERT OR UPDATE ON public.user_payment_methods
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_upm();

-- Add columns to withdrawal_requests (after creating the referenced table)
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.user_payment_methods(id),
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Make bank detail columns nullable for method-based withdrawals
DO $$ BEGIN
  ALTER TABLE public.withdrawal_requests ALTER COLUMN bank_account_number DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.withdrawal_requests ALTER COLUMN ifsc_code DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.withdrawal_requests ALTER COLUMN account_holder_name DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; END $$;