
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

// Initialize Supabase client with user token
export function initSupabaseClient(token: string, useServiceRole = false) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = useServiceRole 
    ? (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '') 
    : (Deno.env.get('SUPABASE_ANON_KEY') || '')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("Server configuration error");
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: useServiceRole ? {} : {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

// Verify user token and get user ID with improved error handling
export async function verifyUserToken(supabaseClient: any) {
  try {
    console.log('Verifying user authentication...');
    
    // Try to get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError) {
      console.error("Authentication error:", authError.message);
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    
    if (!user || !user.id) {
      console.error("No valid user found in token");
      throw new Error('Invalid authentication token - please log in again')
    }
    
    console.log('User authenticated successfully:', user.id);
    return user
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error('Authentication required - please log in again')
  }
}
