-- Add screenshot_url and transaction_ref columns to payment_requests
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS screenshot_url text,
ADD COLUMN IF NOT EXISTS transaction_ref text;