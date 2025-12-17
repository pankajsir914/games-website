-- Fix storage RLS policies for promotion-banners bucket
-- Allow master admins to upload banner images

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Master admins can upload promotion banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view promotion banners" ON storage.objects;
DROP POLICY IF EXISTS "Master admins can update promotion banners" ON storage.objects;
DROP POLICY IF EXISTS "Master admins can delete promotion banners" ON storage.objects;

-- Create policies for promotion-banners bucket
CREATE POLICY "Master admins can upload promotion banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'promotion-banners' 
  AND has_admin_role(auth.uid(), 'master_admin')
);

CREATE POLICY "Public can view promotion banners"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'promotion-banners');

CREATE POLICY "Master admins can update promotion banners"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'promotion-banners' 
  AND has_admin_role(auth.uid(), 'master_admin')
)
WITH CHECK (
  bucket_id = 'promotion-banners' 
  AND has_admin_role(auth.uid(), 'master_admin')
);

CREATE POLICY "Master admins can delete promotion banners"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'promotion-banners' 
  AND has_admin_role(auth.uid(), 'master_admin')
);

-- Ensure the bucket is public for viewing banners
UPDATE storage.buckets 
SET public = true 
WHERE id = 'promotion-banners';