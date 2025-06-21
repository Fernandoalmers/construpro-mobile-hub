
-- Create the missing is_admin() RPC function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_admin BOOLEAN DEFAULT false;
BEGIN
  -- Get the current user's admin status from profiles
  SELECT COALESCE(is_admin, false) INTO user_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_admin, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
