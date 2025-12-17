-- Add payment method support to withdrawal_requests
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id),
ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Make existing bank detail columns nullable since they might not be used when selecting from saved methods
ALTER TABLE public.withdrawal_requests
ALTER COLUMN bank_account_number DROP NOT NULL,
ALTER COLUMN ifsc_code DROP NOT NULL,
ALTER COLUMN account_holder_name DROP NOT NULL;

-- Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('bank_account', 'upi')),
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  upi_id TEXT,
  nickname TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
ON public.payment_methods
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
ON public.payment_methods
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
ON public.payment_methods
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
ON public.payment_methods
FOR DELETE
USING (auth.uid() = user_id);

-- Function to ensure only one primary payment method per user
CREATE OR REPLACE FUNCTION ensure_single_primary_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If this method is being set as primary
  IF NEW.is_primary = true THEN
    -- Set all other payment methods for this user as non-primary
    UPDATE public.payment_methods
    SET is_primary = false
    WHERE user_id = NEW.user_id 
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary payment method
DROP TRIGGER IF EXISTS ensure_single_primary ON public.payment_methods;
CREATE TRIGGER ensure_single_primary
BEFORE INSERT OR UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_payment_method();