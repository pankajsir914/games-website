-- Add image_url column to diamond_casino_tables
ALTER TABLE public.diamond_casino_tables 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN public.diamond_casino_tables.image_url IS 'URL or path to the table image';

