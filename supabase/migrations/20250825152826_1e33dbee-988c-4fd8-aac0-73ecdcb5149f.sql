-- Harden functions created earlier: set search_path and add updated_at trigger
DO $$ BEGIN
  -- Add updated_at trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_sports_match_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_sports_match_settings_updated_at
    BEFORE UPDATE ON public.sports_match_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Ensure function search_path is locked to public
ALTER FUNCTION public.toggle_match_betting(text, text, boolean, jsonb)
  SET search_path = public;
ALTER FUNCTION public.get_match_betting_settings(text)
  SET search_path = public;