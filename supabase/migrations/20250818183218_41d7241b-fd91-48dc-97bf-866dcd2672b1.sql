-- Safe public caching for sports_matches_cache with strict TTL and scope
-- Enable RLS already on table; add constrained insert/update policies

-- Allow anon and authenticated to insert short-lived cache rows for supported sports
CREATE POLICY "Public can insert sports cache with short TTL"
ON public.sports_matches_cache
FOR INSERT
TO anon, authenticated
WITH CHECK (
  expires_at > now()
  AND expires_at <= now() + interval '10 minutes'
  AND sport_type IN ('football','cricket','hockey','basketball','tennis','baseball','kabaddi','table-tennis','boxing')
  AND match_kind IN ('live','upcoming','results')
);

-- Allow anon and authenticated to update (upsert) short-lived cache rows within same constraints
CREATE POLICY "Public can update sports cache with short TTL"
ON public.sports_matches_cache
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  expires_at > now()
  AND expires_at <= now() + interval '10 minutes'
  AND sport_type IN ('football','cricket','hockey','basketball','tennis','baseball','kabaddi','table-tennis','boxing')
  AND match_kind IN ('live','upcoming','results')
);
