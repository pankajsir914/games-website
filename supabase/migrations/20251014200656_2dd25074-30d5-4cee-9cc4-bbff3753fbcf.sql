-- Create function to get user details including email for admins
CREATE OR REPLACE FUNCTION public.get_user_details_for_admin(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Only admins can access this
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access user details';
  END IF;

  -- Get user details from auth.users and profiles
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'phone', COALESCE(p.phone, u.phone),
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'created_at', p.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed_at', u.email_confirmed_at,
    'current_balance', COALESCE(w.current_balance, 0),
    'status', CASE 
      WHEN u.last_sign_in_at > NOW() - INTERVAL '5 minutes' THEN 'online'
      WHEN u.last_sign_in_at > NOW() - INTERVAL '1 hour' THEN 'recently_active'
      ELSE 'offline'
    END
  ) INTO v_result
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.wallets w ON w.user_id = u.id
  WHERE u.id = p_user_id;

  RETURN v_result;
END;
$$;