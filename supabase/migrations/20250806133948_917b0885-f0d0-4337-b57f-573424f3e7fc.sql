-- Create aviator chat messages table
CREATE TABLE public.aviator_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'win')),
  multiplier NUMERIC,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aviator_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view aviator chat messages" 
ON public.aviator_chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create aviator chat messages" 
ON public.aviator_chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create view for live betting data
CREATE OR REPLACE VIEW public.aviator_live_bets AS
SELECT 
  ab.id,
  ab.user_id,
  p.full_name as username,
  ab.bet_amount,
  ab.auto_cashout_multiplier,
  ab.cashout_multiplier,
  ab.payout_amount,
  ab.status,
  ab.created_at,
  ar.round_number,
  ar.status as round_status
FROM aviator_bets ab
JOIN aviator_rounds ar ON ab.round_id = ar.id
LEFT JOIN profiles p ON ab.user_id = p.id
WHERE ar.status IN ('betting', 'flying')
ORDER BY ab.created_at DESC;

-- Create stored procedure for processing live chat
CREATE OR REPLACE FUNCTION public.create_aviator_chat_message(
  p_user_id UUID,
  p_username TEXT,
  p_message TEXT,
  p_message_type TEXT DEFAULT 'user',
  p_multiplier NUMERIC DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO public.aviator_chat_messages (
    user_id, username, message, message_type, multiplier, amount
  ) VALUES (
    p_user_id, p_username, p_message, p_message_type, p_multiplier, p_amount
  ) RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$;