
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

  -- Create policy for users to read store profiles
  DROP POLICY IF EXISTS "Users can read store profiles" ON public.profiles;
  CREATE POLICY "Users can read store profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (papel = 'lojista' OR tipo_perfil = 'lojista');
    
  -- Create policy for users to read professional profiles
  DROP POLICY IF EXISTS "Users can read professional profiles" ON public.profiles;
  CREATE POLICY "Users can read professional profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (papel = 'profissional' OR tipo_perfil = 'profissional');
    
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Profile policies created successfully'
  );
  
  RETURN result;
END;
$$;
