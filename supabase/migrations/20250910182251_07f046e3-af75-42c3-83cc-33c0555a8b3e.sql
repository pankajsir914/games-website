-- Fix Security Definer View issues by enforcing security invoker on views
-- This ensures the views evaluate permissions and RLS under the querying user

-- Safely update views if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'aviator_live_bets'
  ) THEN
    EXECUTE 'ALTER VIEW public.aviator_live_bets SET (security_invoker = true)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'roulette_live_bets'
  ) THEN
    EXECUTE 'ALTER VIEW public.roulette_live_bets SET (security_invoker = true)';
  END IF;
END$$;