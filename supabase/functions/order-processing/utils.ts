
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

// Initialize Supabase client for user authentication
export function initUserClient(token: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("Server configuration error");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
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
}

// Initialize Supabase client with service role for admin operations
export function initServiceRoleClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase service role environment variables");
    throw new Error("Server configuration error");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  })
}

// Verify user token and get user ID
export async function verifyUserToken(userClient: any) {
  try {
    console.log('Verifying user authentication...');
    
    // Try to get the authenticated user using the user client
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    
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
