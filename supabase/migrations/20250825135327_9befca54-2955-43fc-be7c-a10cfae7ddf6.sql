-- Create table for storing user payment methods
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('bank_account', 'upi')),
  is_primary BOOLEAN DEFAULT false,
  
  -- Bank account fields
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  
  -- UPI fields
  upi_id TEXT,
  
  -- Common fields
  nickname TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);

-- Create unique index for primary payment method per user
CREATE UNIQUE INDEX unique_primary_payment_method_per_user 
ON public.user_payment_methods(user_id) 
WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own payment methods" 
ON public.user_payment_methods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payment methods" 
ON public.user_payment_methods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" 
ON public.user_payment_methods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" 
ON public.user_payment_methods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_payment_methods_updated_at
BEFORE UPDATE ON public.user_payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();