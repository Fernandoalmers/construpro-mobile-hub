
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    }

    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Client with Service Role token (bypassing RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create avatars bucket if it doesn't exist
    const { data, error } = await supabase.storage
      .createBucket('avatars', {
        public: true,  // Make bucket publicly accessible
        fileSizeLimit: 1024 * 1024 * 2,  // 2MB limit
      })

    if (error && error.message !== 'Duplicate name') {
      throw error
    }

    console.log("Created avatars bucket:", data)

    // Set RLS policies for the storage bucket
    const policiesResult = await supabase.rpc('create_storage_policies')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Avatar bucket created successfully',
        bucket: data || { name: 'avatars' }
      }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error("Error creating avatar bucket:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
