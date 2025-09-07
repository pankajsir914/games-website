-- Add missing label column to diamond_sports_config table
ALTER TABLE public.diamond_sports_config 
ADD COLUMN IF NOT EXISTS label text;

-- Create function to get all Diamond Sports SID configurations
CREATE OR REPLACE FUNCTION public.get_diamond_sids(p_sport_type text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only admins can access this
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access SID configurations';
  END IF;

  RETURN jsonb_build_object(
    'configs', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'sport_type', sport_type,
          'sid', sid,
          'label', label,
          'is_active', is_active,
          'is_default', is_default,
          'auto_sync', auto_sync,
          'sync_interval', sync_interval,
          'created_at', created_at,
          'updated_at', updated_at
        )
      )
      FROM public.diamond_sports_config
      WHERE (p_sport_type IS NULL OR sport_type = p_sport_type)
      ORDER BY sport_type, is_default DESC NULLS LAST, created_at DESC
    ), '[]'::jsonb)
  );
END;
$function$;

-- Create function to delete Diamond Sports SID configuration
CREATE OR REPLACE FUNCTION public.delete_diamond_sports_sid(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_sport_type text;
  v_was_default boolean;
  v_new_default_id uuid;
BEGIN
  -- Only master admins can delete SIDs
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can delete SID configurations';
  END IF;

  -- Get the sport type and default status before deletion
  SELECT sport_type, is_default INTO v_sport_type, v_was_default
  FROM public.diamond_sports_config
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SID configuration not found';
  END IF;

  -- Delete the configuration
  DELETE FROM public.diamond_sports_config WHERE id = p_id;

  -- If this was the default, set another one as default
  IF v_was_default THEN
    -- Find the first active config for this sport
    SELECT id INTO v_new_default_id
    FROM public.diamond_sports_config
    WHERE sport_type = v_sport_type
    AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    -- Update it to be the default
    IF v_new_default_id IS NOT NULL THEN
      UPDATE public.diamond_sports_config
      SET is_default = true
      WHERE id = v_new_default_id;
    END IF;
  END IF;

  -- Log the activity
  PERFORM log_admin_activity(
    'delete_diamond_sid',
    'diamond_sports_config',
    p_id,
    jsonb_build_object('sport_type', v_sport_type)
  );

  RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$function$;

-- Insert some default SID configurations for common sports
INSERT INTO public.diamond_sports_config (sport_type, sid, label, is_active, is_default, created_by)
VALUES 
  ('cricket', '4', 'Cricket - Default', true, true, auth.uid()),
  ('football', '1', 'Football - Default', true, true, auth.uid()),
  ('tennis', '2', 'Tennis - Default', true, true, auth.uid()),
  ('basketball', '7', 'Basketball - Default', true, true, auth.uid())
ON CONFLICT (sport_type, sid) DO UPDATE SET
  label = EXCLUDED.label,
  is_active = true,
  is_default = CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM diamond_sports_config 
      WHERE sport_type = EXCLUDED.sport_type AND is_default = true AND id != diamond_sports_config.id
    ) THEN true
    ELSE diamond_sports_config.is_default
  END,
  updated_at = NOW();