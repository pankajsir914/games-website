-- Update RPC functions to require master admin privileges for roulette game management

-- Update place_roulette_bet to be more secure but keep user access for betting
-- (No changes needed as this is for user betting)

-- Create a function to check master admin role specifically for game management
CREATE OR REPLACE FUNCTION public.is_master_admin_user(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT has_admin_role(_user_id, 'master_admin'::admin_role)
$function$;

-- Update process_roulette_round function to require master admin (if it exists)
-- This will be called by edge functions, so we'll update the edge function validation

-- Update game_settings table policies to require master admin for roulette management
DROP POLICY IF EXISTS "Admins can manage game settings" ON public.game_settings;

CREATE POLICY "Master admins can manage all game settings"
ON public.game_settings
FOR ALL
USING (has_admin_role(auth.uid(), 'master_admin'::admin_role));

CREATE POLICY "Admins can manage non-platform game settings"
ON public.game_settings
FOR ALL  
USING (
  is_admin_user(auth.uid()) AND game_type != 'platform'
);