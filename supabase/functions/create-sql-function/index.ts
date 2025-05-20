
// This edge function creates the SQL execution function needed by db-utils
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    })
    
    // Create the SQL execution function if it doesn't exist already
    const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.execute_custom_sql(sql_statement TEXT)
    RETURNS JSONB 
    LANGUAGE plpgsql
    SECURITY DEFINER 
    SET search_path = public
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE sql_statement;
      result := '{"status": "success"}'::JSONB;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      result := jsonb_build_object(
        'status', 'error',
        'error', SQLERRM,
        'detail', SQLSTATE
      );
      RETURN result;
    END;
    $$;
    
    -- Grant execution permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.execute_custom_sql TO authenticated;
    `
    
    // Create the SQL execution function
    const { data, error } = await supabase.rpc('execute_custom_sql', {
      sql_statement: createFunctionSQL
    })
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders }
      )
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'SQL execution function created successfully' }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
