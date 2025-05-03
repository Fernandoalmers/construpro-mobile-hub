
CREATE OR REPLACE FUNCTION public.create_storage_policies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Create policy for users to read all objects in avatars bucket
  DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
  CREATE POLICY "Allow public read access to avatars" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');
    
  -- Create policy for users to upload their own avatars
  DROP POLICY IF EXISTS "Allow users to upload avatars" ON storage.objects;
  CREATE POLICY "Allow users to upload avatars" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars');
    
  -- Create policy for users to update their own avatars
  DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
  CREATE POLICY "Allow users to update their own avatars" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'avatars' AND auth.uid() = owner);
    
  -- Create policy for users to delete their own avatars
  DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;
  CREATE POLICY "Allow users to delete their own avatars" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'avatars' AND auth.uid() = owner);
    
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Storage policies created successfully'
  );
  
  RETURN result;
END;
$$;
