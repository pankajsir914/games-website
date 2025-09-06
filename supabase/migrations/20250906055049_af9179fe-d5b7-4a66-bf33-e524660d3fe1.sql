-- Drop existing function first
DROP FUNCTION IF EXISTS public.create_aviator_chat_message(text, text, numeric, numeric);

-- Create RPC function to create chat messages with proper return type
CREATE OR REPLACE FUNCTION public.create_aviator_chat_message(
    p_message TEXT,
    p_message_type TEXT DEFAULT 'user',
    p_multiplier NUMERIC DEFAULT NULL,
    p_amount NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_username TEXT;
    v_message_id UUID;
    v_cleaned_message TEXT;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Validate message
    IF LENGTH(TRIM(p_message)) < 1 OR LENGTH(TRIM(p_message)) > 200 THEN
        RAISE EXCEPTION 'Message must be between 1 and 200 characters';
    END IF;
    
    -- Clean message
    v_cleaned_message := regexp_replace(TRIM(p_message), '<[^>]*>', '', 'gi');
    
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
        COALESCE(v_username, 'Anonymous'),
        v_cleaned_message,
        p_message_type,
        p_multiplier,
        p_amount
    ) RETURNING id INTO v_message_id;
    
    RETURN v_message_id;
END;
$$;