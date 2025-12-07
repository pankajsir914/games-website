
-- Add RLS policies to allow admins to read all user bets and transactions

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_or_master()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'master_admin')
  );
$$;

-- Wallet Transactions: Allow admins to read all transactions
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
FOR SELECT USING (public.is_admin_or_master());

-- Aviator Bets: Allow admins to read all bets
CREATE POLICY "Admins can view all aviator bets" ON public.aviator_bets
FOR SELECT USING (public.is_admin_or_master());

-- Roulette Bets: Allow admins to read all bets
CREATE POLICY "Admins can view all roulette bets" ON public.roulette_bets
FOR SELECT USING (public.is_admin_or_master());

-- Teen Patti Bets: Allow admins to read all bets
CREATE POLICY "Admins can view all teen patti bets" ON public.teen_patti_bets
FOR SELECT USING (public.is_admin_or_master());

-- Andar Bahar Bets: Allow admins to read all bets
CREATE POLICY "Admins can view all andar bahar bets" ON public.andar_bahar_bets
FOR SELECT USING (public.is_admin_or_master());

-- Color Prediction Bets: Allow admins to read all bets
CREATE POLICY "Admins can view all color prediction bets" ON public.color_prediction_bets
FOR SELECT USING (public.is_admin_or_master());

-- Diamond Casino Bets: Allow admins to read all bets
CREATE POLICY "Admins can view all casino bets" ON public.diamond_casino_bets
FOR SELECT USING (public.is_admin_or_master());

-- Game Sessions: Allow admins to read all sessions
CREATE POLICY "Admins can view all game sessions" ON public.game_sessions
FOR SELECT USING (public.is_admin_or_master());

-- Chicken Run Bets: Allow admins to read all bets (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chicken_run_bets' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can view all chicken run bets" ON public.chicken_run_bets FOR SELECT USING (public.is_admin_or_master())';
  END IF;
END $$;

-- Jackpot Entries: Allow admins to read all entries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jackpot_entries' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can view all jackpot entries" ON public.jackpot_entries FOR SELECT USING (public.is_admin_or_master())';
  END IF;
END $$;
