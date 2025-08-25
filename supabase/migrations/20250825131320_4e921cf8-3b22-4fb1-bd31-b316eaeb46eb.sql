-- Create or replace the function to get user management data with auth.users access
CREATE OR REPLACE FUNCTION public.get_all_users_for_master_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  -- Only master admins can access this
  IF NOT has_admin_role(auth.uid(), 'master_admin') THEN
    RAISE EXCEPTION 'Only master admins can access user data';
  END IF;

  WITH user_data AS (
    SELECT 
      u.id,
      u.email,
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at,
      u.phone,
      p.full_name,
      p.phone as profile_phone,
      p.avatar_url,
      p.created_by,
      w.current_balance,
      ur.role as user_role,
      CASE 
        WHEN u.last_sign_in_at > NOW() - INTERVAL '5 minutes' THEN 'online'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '1 hour' THEN 'recently_active'
        ELSE 'offline'
      END as status
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.wallets w ON w.user_id = u.id
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = u.id 
      AND ur2.role IN ('admin', 'master_admin')
    )
    ORDER BY u.created_at DESC
    LIMIT 200
  ),
  transaction_summaries AS (
    SELECT 
      user_id,
      SUM(CASE WHEN type = 'credit' AND reason ILIKE '%deposit%' THEN amount ELSE 0 END) as total_deposits,
      SUM(CASE WHEN type = 'debit' AND reason ILIKE '%withdraw%' THEN amount ELSE 0 END) as total_withdrawals,
      COUNT(*) as transaction_count
    FROM public.wallet_transactions
    GROUP BY user_id
  ),
  game_summaries AS (
    SELECT 
      user_id,
      COUNT(*) as games_played
    FROM (
      SELECT user_id FROM aviator_bets
      UNION ALL
      SELECT user_id FROM color_prediction_bets
      UNION ALL
      SELECT user_id FROM andar_bahar_bets
      UNION ALL
      SELECT user_id FROM roulette_bets
    ) all_games
    GROUP BY user_id
  )
  SELECT jsonb_build_object(
    'users', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', ud.id,
        'email', ud.email,
        'full_name', COALESCE(ud.full_name, 'User'),
        'phone', COALESCE(ud.profile_phone, ud.phone, ''),
        'avatar_url', ud.avatar_url,
        'created_at', ud.created_at,
        'last_sign_in_at', ud.last_sign_in_at,
        'email_confirmed_at', ud.email_confirmed_at,
        'current_balance', COALESCE(ud.current_balance, 0),
        'total_deposits', COALESCE(ts.total_deposits, 0),
        'total_withdrawals', COALESCE(ts.total_withdrawals, 0),
        'games_played', COALESCE(gs.games_played, 0),
        'status', ud.status,
        'created_by', ud.created_by,
        'user_role', ud.user_role
      )
    ), '[]'::jsonb),
    'total_count', COUNT(ud.id),
    'online_count', COUNT(CASE WHEN ud.status = 'online' THEN 1 END),
    'recently_active_count', COUNT(CASE WHEN ud.status = 'recently_active' THEN 1 END)
  ) INTO v_result
  FROM user_data ud
  LEFT JOIN transaction_summaries ts ON ts.user_id = ud.id
  LEFT JOIN game_summaries gs ON gs.user_id = ud.id;

  RETURN v_result;
END;
$function$;