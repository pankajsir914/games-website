-- Assign master admin role and seed wallet for the specified email
-- Uses existing SECURITY DEFINER function
select public.setup_master_admin('masteradmin@masteradmin.com');