-- Add column to track if password change is required
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false;

-- Update existing profiles to not require password change
UPDATE public.profiles 
SET requires_password_change = false 
WHERE requires_password_change IS NULL;