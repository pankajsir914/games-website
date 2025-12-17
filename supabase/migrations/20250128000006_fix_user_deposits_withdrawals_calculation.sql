-- Fix get_users_management_data to correctly calculate deposits and withdrawals
-- The issue is that transaction reasons might be "Payment approved" or "Withdrawal approved"
-- instead of just containing "deposit" or "withdrawal"

CREATE OR REPLACE FUNCTION public.get_users_management_data(
  p_limit integer DEFAULT 50, 
  p_offset integer DEFAULT 0, 
  p_search text DEFAULT NULL::text, 
  p_status text DEFAULT 'all'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_users jsonb;
  v_total_count integer;
  v_user_role text;
  v_admin_filter uuid;
BEGIN
  -- Only admins can access this
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access user management data';
  END IF;

  -- Get user role
  SELECT public.get_user_highest_role(auth.uid()) INTO v_user_role;
  
  -- Set admin filter - regular admins only see users they created
  IF v_user_role = 'admin' THEN
    v_admin_filter := auth.uid();
  ELSE
    v_admin_filter := NULL; -- Master admin sees all
  END IF;

  -- Get users with comprehensive data
  WITH user_data AS (
    SELECT 
      u.id,
      u.email,
      u.created_at,
      u.last_sign_in_at,
      p.full_name,
      p.phone,
      p.created_by,
      creator_profile.full_name as creator_name,
      w.current_balance,
      COALESCE(deposits.total, 0) as total_deposits,
      COALESCE(withdrawals.total, 0) as total_withdrawals,
      COALESCE(games.count, 0) as games_played,
      CASE 
        WHEN u.last_sign_in_at > NOW() - INTERVAL '5 minutes' THEN 'online'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '1 hour' THEN 'recently_active'
        ELSE 'offline'
      END as status
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN profiles creator_profile ON creator_profile.id = p.created_by
    LEFT JOIN wallets w ON w.user_id = u.id
    LEFT JOIN (
      SELECT user_id, SUM(amount) as total
      FROM wallet_transactions
      WHERE type = 'credit' 
        AND (
          reason ILIKE '%deposit%' 
          OR reason ILIKE '%payment%'
          OR reason ILIKE '%points added%'
          OR reason ILIKE '%payment approved%'
        )
      GROUP BY user_id
    ) deposits ON deposits.user_id = u.id
    LEFT JOIN (
      SELECT user_id, SUM(amount) as total
      FROM wallet_transactions
      WHERE type = 'debit' 
        AND (
          reason ILIKE '%withdrawal%' 
          OR reason ILIKE '%withdraw%'
          OR reason ILIKE '%points redeemed%'
          OR reason ILIKE '%withdrawal approved%'
        )
      GROUP BY user_id
    ) withdrawals ON withdrawals.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as count
      FROM (
        SELECT user_id FROM aviator_bets
        UNION ALL
        SELECT user_id FROM color_prediction_bets
        UNION ALL
        SELECT user_id FROM andar_bahar_bets
        UNION ALL
        SELECT user_id FROM roulette_bets
      ) all_bets
      GROUP BY user_id
    ) games ON games.user_id = u.id
    WHERE 
      -- Filter by admin if regular admin
      (v_admin_filter IS NULL OR p.created_by = v_admin_filter)
      AND
      -- Exclude admin/master_admin users from regular user list
      NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = u.id 
        AND ur.role IN ('admin', 'master_admin')
      )
      AND
      -- Search filter
      (p_search IS NULL OR 
       p.full_name ILIKE '%' || p_search || '%' OR 
       u.email ILIKE '%' || p_search || '%' OR
       p.phone ILIKE '%' || p_search || '%')
      AND 
      -- Status filter
      (p_status = 'all' OR 
       CASE 
         WHEN u.last_sign_in_at > NOW() - INTERVAL '5 minutes' THEN 'online'
         WHEN u.last_sign_in_at > NOW() - INTERVAL '1 hour' THEN 'recently_active'
         ELSE 'offline'
       END = p_status)
    ORDER BY u.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT jsonb_agg(row_to_json(user_data)) INTO v_users FROM user_data;

  -- Get total count for pagination
  SELECT COUNT(*) INTO v_total_count
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE 
    -- Filter by admin if regular admin
    (v_admin_filter IS NULL OR p.created_by = v_admin_filter)
    AND
    -- Exclude admin/master_admin users
    NOT EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = u.id 
      AND ur.role IN ('admin', 'master_admin')
    )
    AND
    -- Search filter
    (p_search IS NULL OR 
     p.full_name ILIKE '%' || p_search || '%' OR 
     u.email ILIKE '%' || p_search || '%' OR
     p.phone ILIKE '%' || p_search || '%')
    AND 
    -- Status filter
    (p_status = 'all' OR 
     CASE 
       WHEN u.last_sign_in_at > NOW() - INTERVAL '5 minutes' THEN 'online'
       WHEN u.last_sign_in_at > NOW() - INTERVAL '1 hour' THEN 'recently_active'
       ELSE 'offline'
     END = p_status);

  RETURN jsonb_build_object(
    'users', COALESCE(v_users, '[]'::jsonb),
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset,
    'user_role', v_user_role
  );
END;
$function$;





