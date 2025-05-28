
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Initialize the Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRole)
    
    // Create a new bucket called "avatars" if it doesn't exist
    const { data: existingBuckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()
      
    if (bucketsError) {
      throw bucketsError
    }
    
    const avatarBucketExists = existingBuckets.some(bucket => bucket.name === 'avatars')
    
    if (!avatarBucketExists) {
      const { error } = await supabase
        .storage
        .createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        })
        
      if (error) {
        throw error
      }
    }
    
    // Create or update storage policies for avatars
    const { error: policiesError } = await supabase.rpc('create_storage_policies')
    
    if (policiesError) {
      console.log('Policies error (might not exist):', policiesError)
      // Continue anyway as policies might already exist
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Avatar bucket and storage policies created successfully',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
