
CREATE OR REPLACE FUNCTION public.create_storage_policies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Create policy for avatar uploads
  BEGIN
    DROP POLICY IF EXISTS "Avatar uploads require authentication" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  CREATE POLICY "Avatar uploads require authentication"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (auth.uid())::text = (storage.foldername(name))[1]
    );

  -- Create policy for users to update their own avatars
  BEGIN
    DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  CREATE POLICY "Users can update their own avatars"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (auth.uid())::text = (storage.foldername(name))[1]
    );

  -- Create policy for users to delete their own avatars
  BEGIN
    DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  CREATE POLICY "Users can delete their own avatars"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (auth.uid())::text = (storage.foldername(name))[1]
    );

  -- Create policy for public access to avatars
  BEGIN
    DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Storage policies created successfully'
  );
  
  RETURN result;
END;
$$;
