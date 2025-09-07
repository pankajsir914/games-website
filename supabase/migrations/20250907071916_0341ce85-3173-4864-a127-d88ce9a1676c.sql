-- Fix the get_diamond_sids function to allow master admins
CREATE OR REPLACE FUNCTION public.get_diamond_sids(p_sport_type text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Allow both admins and master_admins to access
  IF NOT (is_admin_user(auth.uid()) OR has_admin_role(auth.uid(), 'master_admin')) THEN
    RAISE EXCEPTION 'Only admins can access SID configurations';
  END IF;

  RETURN jsonb_build_object(
    'configs', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'sport_type', sport_type,
          'sid', sid,
          'is_active', is_active,
          'auto_sync', auto_sync,
          'sync_interval', sync_interval,
          'label', label,
          'is_default', is_default,
          'created_at', created_at,
          'updated_at', updated_at
        )
      )
      FROM public.diamond_sports_config
      WHERE (p_sport_type IS NULL OR sport_type = p_sport_type)
      ORDER BY sport_type
    )
  );
END;
$function$;

-- Also fix the manage function
CREATE OR REPLACE FUNCTION public.manage_diamond_sports_sid(
  p_sport_type text,
  p_sid text DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_auto_sync boolean DEFAULT false,
  p_sync_interval integer DEFAULT 60,
  p_label text DEFAULT NULL,
  p_is_default boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Allow both admins and master_admins
  IF NOT (is_admin_user(auth.uid()) OR has_admin_role(auth.uid(), 'master_admin')) THEN
    RAISE EXCEPTION 'Only admins can manage Diamond sports SIDs';
  END IF;

  -- If setting as default, unset other defaults
  IF p_is_default THEN
    UPDATE public.diamond_sports_config 
    SET is_default = false 
    WHERE sport_type != p_sport_type;
  END IF;

  -- Insert or update SID configuration
  INSERT INTO public.diamond_sports_config (
    sport_type,
    sid,
    is_active,
    auto_sync,
    sync_interval,
    label,
    is_default
  ) VALUES (
    p_sport_type,
    p_sid,
    p_is_active,
    p_auto_sync,
    p_sync_interval,
    p_label,
    p_is_default
  )
  ON CONFLICT (sport_type) DO UPDATE SET
    sid = COALESCE(EXCLUDED.sid, diamond_sports_config.sid),
    is_active = EXCLUDED.is_active,
    auto_sync = EXCLUDED.auto_sync,
    sync_interval = EXCLUDED.sync_interval,
    label = COALESCE(EXCLUDED.label, diamond_sports_config.label),
    is_default = EXCLUDED.is_default,
    updated_at = NOW();

  -- Return the updated configuration
  SELECT jsonb_build_object(
    'success', true,
    'sport_type', p_sport_type,
    'sid', COALESCE(p_sid, sid),
    'is_active', p_is_active,
    'auto_sync', p_auto_sync,
    'sync_interval', p_sync_interval,
    'label', COALESCE(p_label, label),
    'is_default', p_is_default
  ) INTO v_result
  FROM public.diamond_sports_config
  WHERE sport_type = p_sport_type;

  RETURN v_result;
END;
$function$;

-- Also fix the delete function
CREATE OR REPLACE FUNCTION public.delete_diamond_sports_sid(p_sport_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Allow both admins and master_admins
  IF NOT (is_admin_user(auth.uid()) OR has_admin_role(auth.uid(), 'master_admin')) THEN
    RAISE EXCEPTION 'Only admins can delete Diamond sports SIDs';
  END IF;

  DELETE FROM public.diamond_sports_config
  WHERE sport_type = p_sport_type;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_sport_type', p_sport_type
  );
END;
$function$;