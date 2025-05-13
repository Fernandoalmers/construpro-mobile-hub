
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

// Verify user token and get user ID
export async function verifyUserToken(supabaseClient: any) {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(authError?.message || 'Authentication failed')
    }
    
    if (!user) {
      console.error("No user found in token");
      throw new Error('User not found or not authenticated')
    }
    
    return user
  } catch (error) {
    console.error("Token verification error:", error);
    throw new Error('Invalid authentication token')
  }
}
