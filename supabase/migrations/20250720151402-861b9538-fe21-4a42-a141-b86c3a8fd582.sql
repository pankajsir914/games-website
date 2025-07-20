
-- Create custom types
CREATE TYPE game_type AS ENUM ('ludo', 'aviator', 'casino', 'color_prediction');
CREATE TYPE transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'completed', 'cancelled');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (current_balance >= 0),
  locked_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (locked_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type transaction_type NOT NULL,
  reason TEXT NOT NULL,
  game_type game_type,
  game_session_id UUID,
  balance_after DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_sessions table
CREATE TABLE public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type game_type NOT NULL,
  players JSONB NOT NULL DEFAULT '[]',
  entry_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_pool DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  result JSONB,
  status game_status DEFAULT 'waiting',
  max_players INTEGER DEFAULT 4,
  current_players INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for wallets
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for game_sessions
CREATE POLICY "Users can view all game sessions" ON public.game_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create game sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update game sessions they created or joined" ON public.game_sessions
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid()::text = ANY(SELECT jsonb_array_elements_text(players -> 'user_ids'))
  );

-- Create function to automatically create wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update wallet balance with transaction logging
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_type transaction_type,
  p_reason TEXT,
  p_game_type game_type DEFAULT NULL,
  p_game_session_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_wallet_record RECORD;
  v_new_balance DECIMAL(10,2);
BEGIN
  -- Get current wallet state
  SELECT current_balance, locked_balance INTO v_wallet_record
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Calculate new balance
  IF p_type = 'credit' THEN
    v_new_balance := v_wallet_record.current_balance + p_amount;
  ELSE
    v_new_balance := v_wallet_record.current_balance - p_amount;
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;
  END IF;
  
  -- Update wallet
  UPDATE public.wallets
  SET current_balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Insert transaction record
  INSERT INTO public.wallet_transactions (
    user_id, amount, type, reason, game_type, game_session_id, balance_after
  ) VALUES (
    p_user_id, p_amount, p_type, p_reason, p_game_type, p_game_session_id, v_new_balance
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'transaction_amount', p_amount,
    'transaction_type', p_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to lock/unlock wallet balance
CREATE OR REPLACE FUNCTION public.lock_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_lock BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
  v_wallet_record RECORD;
BEGIN
  SELECT current_balance, locked_balance INTO v_wallet_record
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  IF p_lock THEN
    -- Lock balance
    IF v_wallet_record.current_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient balance to lock';
    END IF;
    
    UPDATE public.wallets
    SET current_balance = current_balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Unlock balance
    IF v_wallet_record.locked_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient locked balance to unlock';
    END IF;
    
    UPDATE public.wallets
    SET current_balance = current_balance + p_amount,
        locked_balance = locked_balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
