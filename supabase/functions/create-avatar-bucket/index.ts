
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    }

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }
    
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Client with Service Role token (bypassing RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    // Client with JWT token (from user) to verify identity
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'Unauthorized' }),
        { status: 401, headers }
      )
    }
    
    // Check if the avatars bucket already exists
    const { data: buckets, error: bucketListError } = await adminClient.storage.listBuckets();
    
    if (bucketListError) {
      console.error("Error listing buckets:", bucketListError);
      return new Response(
        JSON.stringify({ error: bucketListError.message }),
        { status: 500, headers }
      );
    }
    
    // Check if the avatars bucket already exists
    const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucket) {
      // Create the avatars bucket if it doesn't exist
      const { data: newBucket, error: createBucketError } = await adminClient.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (createBucketError) {
        console.error("Error creating bucket:", createBucketError);
        return new Response(
          JSON.stringify({ error: createBucketError.message }),
          { status: 500, headers }
        );
      }
      
      console.log("Created avatars bucket:", newBucket);
      
      // Create a policy that allows authenticated users to upload and read their own files
      const uploadPolicyQuery = `
        CREATE POLICY "Users can upload their own avatars"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
      `;
      
      const readPolicyQuery = `
        CREATE POLICY "Anyone can read avatars"
        ON storage.objects
        FOR SELECT
        TO authenticated, anon
        USING (bucket_id = 'avatars');
      `;
      
      const updatePolicyQuery = `
        CREATE POLICY "Users can update their own avatars"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
      `;
      
      const deletePolicyQuery = `
        CREATE POLICY "Users can delete their own avatars"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
      `;
      
      // Create the policies
      await adminClient.rpc('run_sql', { query: uploadPolicyQuery });
      await adminClient.rpc('run_sql', { query: readPolicyQuery });
      await adminClient.rpc('run_sql', { query: updatePolicyQuery });
      await adminClient.rpc('run_sql', { query: deletePolicyQuery });
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: avatarsBucket ? 'Avatars bucket already exists' : 'Avatars bucket created successfully' 
      }),
      { status: 200, headers }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        } 
      }
    )
  }
})
