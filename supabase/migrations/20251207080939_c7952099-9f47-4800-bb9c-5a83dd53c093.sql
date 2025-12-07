-----------------------------------------
-- 1) HELPER FUNCTION: Check admin role
-----------------------------------------
DROP FUNCTION IF EXISTS has_admin_role(uuid, text);

CREATE FUNCTION has_admin_role(user_id uuid, role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_roles 
    WHERE admin_roles.user_id = user_id
    AND admin_roles.role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-----------------------------------------
-- 2) HELPER FUNCTION: Check if user is admin
-----------------------------------------
DROP FUNCTION IF EXISTS is_admin_user(uuid);

CREATE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_roles 
    WHERE admin_roles.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-----------------------------------------
-- 3) DROP ALL OLD POLICIES
-----------------------------------------
DROP POLICY IF EXISTS "Users select own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins select their users withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Master admin select all withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Master admin update all withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins update their users withdrawals" ON public.withdrawal_requests;


-----------------------------------------
-- 4) USER CAN SELECT ONLY OWN DATA
-----------------------------------------
CREATE POLICY "Users select own withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (
  auth.uid() = user_id
);


-----------------------------------------
-- 5) MASTER ADMIN CAN SELECT ALL
-----------------------------------------
CREATE POLICY "Master admin select all withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (
  has_admin_role(auth.uid(), 'master_admin')
);


-----------------------------------------
-- 6) NORMAL ADMIN CAN SELECT ONLY USERS THEY CREATED
-----------------------------------------
CREATE POLICY "Admins select their users withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (
  is_admin_user(auth.uid())
  AND EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = withdrawal_requests.user_id
    AND p.created_by = auth.uid()
  )
);


-----------------------------------------
-- 7) MASTER ADMIN CAN UPDATE ALL
-----------------------------------------
CREATE POLICY "Master admin update all withdrawals"
ON public.withdrawal_requests
FOR UPDATE
USING (
  has_admin_role(auth.uid(), 'master_admin')
)
WITH CHECK (
  has_admin_role(auth.uid(), 'master_admin')
);


-----------------------------------------
-- 8) NORMAL ADMIN CAN UPDATE ONLY THEIR USERS
-----------------------------------------
CREATE POLICY "Admins update their users withdrawals"
ON public.withdrawal_requests
FOR UPDATE
USING (
  is_admin_user(auth.uid())
  AND EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = withdrawal_requests.user_id
    AND p.created_by = auth.uid()
  )
)
WITH CHECK (
  is_admin_user(auth.uid())
  AND EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = withdrawal_requests.user_id
    AND p.created_by = auth.uid()
  )
);
