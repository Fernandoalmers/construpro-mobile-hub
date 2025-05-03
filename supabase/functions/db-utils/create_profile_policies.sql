
CREATE OR REPLACE FUNCTION public.create_profile_policies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Create policy for users to update their own profile
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id);
    
  -- Create policy for users to read their own profile
  DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
  CREATE POLICY "Users can read their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = id);
    
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Profile policies created successfully'
  );
  
  RETURN result;
END;
$$;
