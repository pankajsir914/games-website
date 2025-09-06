-- Create aviator_live_bets view for real-time betting display
CREATE OR REPLACE VIEW public.aviator_live_bets AS
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
    ar.status as round_status,
    COALESCE(p.full_name, 'Anonymous') as username
FROM aviator_bets ab
JOIN aviator_rounds ar ON ab.round_id = ar.id
LEFT JOIN profiles p ON ab.user_id = p.id
WHERE ar.status IN ('betting', 'flying', 'crashed')
ORDER BY ab.created_at DESC
LIMIT 100;

-- Grant access to the view
GRANT SELECT ON public.aviator_live_bets TO authenticated;
GRANT SELECT ON public.aviator_live_bets TO anon;

-- Create RPC function to create chat messages
CREATE OR REPLACE FUNCTION public.create_aviator_chat_message(
    p_message TEXT,
    p_message_type TEXT DEFAULT 'user',
    p_multiplier NUMERIC DEFAULT NULL,
    p_amount NUMERIC DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_result jsonb;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get username from profile
    SELECT COALESCE(full_name, 'Anonymous') INTO v_username
    FROM profiles
    WHERE id = v_user_id;
    
    -- Insert message
    INSERT INTO aviator_chat_messages (
        user_id,
        username,
        message,
        message_type,
        multiplier,
        amount
    ) VALUES (
        v_user_id,
        v_username,
        p_message,
        p_message_type,
        p_multiplier,
        p_amount
    )
    RETURNING to_jsonb(aviator_chat_messages.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Enable real-time for aviator tables
ALTER PUBLICATION supabase_realtime ADD TABLE aviator_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE aviator_bets;
ALTER PUBLICATION supabase_realtime ADD TABLE aviator_chat_messages;