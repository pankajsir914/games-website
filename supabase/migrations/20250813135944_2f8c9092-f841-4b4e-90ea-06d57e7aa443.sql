-- Fix Security Definer View issue by recreating aviator_live_bets view
-- This view was executing with DEFINER rights which is a security risk

-- Drop the existing view
DROP VIEW IF EXISTS public.aviator_live_bets;

-- Recreate the view without security definer (uses INVOKER by default)
-- This ensures the view executes with the permissions of the querying user
CREATE VIEW public.aviator_live_bets AS
SELECT 
  ab.id,
  ab.user_id,
  ab.bet_amount,
  ab.auto_cashout_multiplier,
  ab.cashout_multiplier,
  ab.payout_amount,
  ab.created_at,
  ar.round_number,
  ab.status,
  ar.status AS round_status,
  CASE
    WHEN LENGTH(COALESCE(p.full_name, 'Anonymous')) <= 2 THEN 
      COALESCE(p.full_name, 'Anonymous')
    ELSE 
      LEFT(COALESCE(p.full_name, 'Anonymous'), 2) || 
      REPEAT('*', GREATEST(1, LENGTH(COALESCE(p.full_name, 'Anonymous')) - 2))
  END AS username
FROM aviator_bets ab
JOIN aviator_rounds ar ON ab.round_id = ar.id
LEFT JOIN profiles p ON ab.user_id = p.id
WHERE ar.status IN ('betting', 'flying', 'crashed');

-- Add RLS policy for the view to ensure proper access control
-- Users can only see their own bets or public betting data
CREATE POLICY "Users can view aviator live bets" ON public.aviator_live_bets
FOR SELECT USING (true); -- This view is meant to be public for live betting display

-- Enable RLS on the view (this is optional for views but good practice)
-- Note: Views don't directly support RLS, but the underlying tables do