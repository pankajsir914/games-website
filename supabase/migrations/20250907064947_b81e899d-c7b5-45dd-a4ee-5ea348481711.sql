
-- 1) Create table to store SIDs per sport (idempotent)
CREATE TABLE IF NOT EXISTS public.diamond_sports_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_type text NOT NULL,
  sid text NOT NULL,
  label text NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  auto_sync boolean NOT NULL DEFAULT false,
  sync_interval integer NOT NULL DEFAULT 60,
  last_sync_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL
);

-- Ensure helpful indexes/constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'diamond_sports_config_sport_sid_unique'
  ) THEN
    ALTER TABLE public.diamond_sports_config
      ADD CONSTRAINT diamond_sports_config_sport_sid_unique UNIQUE (sport_type, sid);
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS diamond_sports_config_one_default_per_sport
  ON public.diamond_sports_config (sport_type)
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS diamond_sports_config_sport_active_idx
  ON public.diamond_sports_config (sport_type, is_active);

-- 2) Update trigger for updated_at (reuse the generic function already present)
DROP TRIGGER IF EXISTS set_updated_at_on_diamond_sports_config ON public.diamond_sports_config;
CREATE TRIGGER set_updated_at_on_diamond_sports_config
BEFORE UPDATE ON public.diamond_sports_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_promotions();

-- 3) RLS
ALTER TABLE public.diamond_sports_config ENABLE ROW LEVEL SECURITY;

-- Admins can view
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='diamond_sports_config' AND policyname='Admins can view SIDs'
  ) THEN
    CREATE POLICY "Admins can view SIDs"
      ON public.diamond_sports_config
      FOR SELECT
      USING (is_admin_user(auth.uid()));
  END IF;
END$$;

-- Master admins manage (ALL) - both USING and WITH CHECK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='diamond_sports_config' AND policyname='Master admins manage SIDs'
  ) THEN
    CREATE POLICY "Master admins manage SIDs"
      ON public.diamond_sports_config
      FOR ALL
      USING (has_admin_role(auth.uid(), 'master_admin'))
      WITH CHECK (has_admin_role(auth.uid(), 'master_admin'));
  END IF;
END$$;

-- 4) RPC: Upsert/manage a SID
CREATE OR REPLACE FUNCTION public.manage_diamond_sports_sid(
  p_id uuid DEFAULT NULL,
  p_sport_type text,
  p_sid text,
  p_label text DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_is_default boolean DEFAULT false,
  p_auto_sync boolean DEFAULT false,
  p_sync_interval integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_row public.diamond_sports_config;
BEGIN
  -- Only master admins can manage SIDs
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can manage Diamond sports SIDs';
  END IF;

  IF p_sport_type IS NULL OR length(trim(p_sport_type)) = 0 THEN
    RAISE EXCEPTION 'sport_type is required';
  END IF;
  IF p_sid IS NULL OR length(trim(p_sid)) = 0 THEN
    RAISE EXCEPTION 'sid is required';
  END IF;

  -- If setting default, clear other defaults in the same sport after we know target id
  IF p_id IS NOT NULL THEN
    UPDATE public.diamond_sports_config
    SET
      sport_type = p_sport_type,
      sid = p_sid,
      label = p_label,
      is_active = COALESCE(p_is_active, is_active),
      is_default = COALESCE(p_is_default, is_default),
      auto_sync = COALESCE(p_auto_sync, auto_sync),
      sync_interval = COALESCE(p_sync_interval, sync_interval)
    WHERE id = p_id
    RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.diamond_sports_config (
      sport_type, sid, label, is_active, is_default, auto_sync, sync_interval, created_by
    )
    VALUES (
      p_sport_type, p_sid, p_label, COALESCE(p_is_active, true), COALESCE(p_is_default, false),
      COALESCE(p_auto_sync, false), COALESCE(p_sync_interval, 60), auth.uid()
    )
    ON CONFLICT (sport_type, sid) DO UPDATE SET
      label = EXCLUDED.label,
      is_active = EXCLUDED.is_active,
      is_default = EXCLUDED.is_default,
      auto_sync = EXCLUDED.auto_sync,
      sync_interval = EXCLUDED.sync_interval,
      updated_at = now()
    RETURNING * INTO v_row;
  END IF;

  -- If default, ensure uniqueness per sport
  IF v_row.is_default THEN
    UPDATE public.diamond_sports_config
    SET is_default = false, updated_at = now()
    WHERE sport_type = v_row.sport_type AND id <> v_row.id AND is_default = true;
  END IF;

  RETURN jsonb_build_object('success', true, 'sid', to_jsonb(v_row));
END;
$function$;

-- 5) RPC: Delete a SID
CREATE OR REPLACE FUNCTION public.delete_diamond_sports_sid(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_exists boolean;
BEGIN
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can delete SIDs';
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.diamond_sports_config WHERE id = p_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'SID not found');
  END IF;

  DELETE FROM public.diamond_sports_config WHERE id = p_id;

  RETURN jsonb_build_object('success', true, 'deleted_id', p_id);
END;
$function$;

-- 6) RPC: Get SIDs (optionally by sport)
CREATE OR REPLACE FUNCTION public.get_diamond_sids(p_sport_type text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can view SIDs';
  END IF;

  RETURN jsonb_build_object(
    'sids',
    COALESCE(
      (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT *
          FROM public.diamond_sports_config
          WHERE (p_sport_type IS NULL OR sport_type = p_sport_type)
          ORDER BY sport_type ASC, is_default DESC, created_at DESC
        ) t
      ),
      '[]'::jsonb
    )
  );
END;
$function$;
