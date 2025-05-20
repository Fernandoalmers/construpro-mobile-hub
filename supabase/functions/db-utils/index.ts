
// This is a utility function to help with database operations
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
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
    
    // Create a client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    })
    
    // Also create a client using the user's JWT for RLS compliance
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      )
    }
    
    const { method, action, sql } = requestData;

    // For logging: get user ID from token if possible
    let userId = 'unknown';
    try {
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      userId = userData?.user?.id || 'unknown';
      console.log(`Request from user ${userId}, action: ${action}`);
    } catch (e) {
      console.error('Error getting user from token:', e);
    }
    
    if (method === 'POST') {
      if (action === 'execute-sql' && sql) {
        console.log(`Executing SQL for user ${userId}`);
        
        // Execute the provided SQL statement using the execute_custom_sql function
        try {
          const { data, error } = await supabaseAdmin.rpc('execute_custom_sql', {
            sql_statement: sql
          });
          
          if (error) {
            console.error(`SQL execution error for user ${userId}:`, error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: corsHeaders }
            )
          }
          
          console.log(`SQL execution successful for user ${userId}`);
          return new Response(
            JSON.stringify({ success: true, data }),
            { status: 200, headers: corsHeaders }
          )
        } catch (sqlError) {
          // If the function doesn't exist yet, try direct SQL execution for setup only
          if (sqlError.message && sqlError.message.includes('function "execute_custom_sql" does not exist')) {
            console.log('Function execute_custom_sql does not exist yet, attempting direct execution for setup');
            
            // Only allow certain setup operations directly
            if (sql.includes('CREATE OR REPLACE FUNCTION') && 
                sql.includes('execute_custom_sql') && 
                sql.includes('SECURITY DEFINER')) {
              
              // This is the setup SQL for our function, allow direct execution
              try {
                // For creating the function, use a direct query (only once during setup)
                const { data: setupData, error: setupError } = await supabaseAdmin.from('_exec_sql').select('*').execute(sql);
                
                if (setupError) {
                  console.error('Error during direct SQL execution:', setupError);
                  return new Response(
                    JSON.stringify({ error: setupError.message }),
                    { status: 500, headers: corsHeaders }
                  )
                }
                
                console.log('Successfully created execute_custom_sql function');
                return new Response(
                  JSON.stringify({ success: true, message: 'SQL function created' }),
                  { status: 200, headers: corsHeaders }
                )
              } catch (directError) {
                console.error('Error during direct SQL execution:', directError);
                return new Response(
                  JSON.stringify({ error: directError.message }),
                  { status: 500, headers: corsHeaders }
                )
              }
            } else {
              console.error('SQL execution function does not exist and this SQL is not allowed for direct execution');
              return new Response(
                JSON.stringify({ 
                  error: 'SQL execution function does not exist. Run the create-sql-function endpoint first.' 
                }),
                { status: 500, headers: corsHeaders }
              )
            }
          } else {
            console.error('Unexpected error during SQL execution:', sqlError);
            return new Response(
              JSON.stringify({ error: sqlError.message }),
              { status: 500, headers: corsHeaders }
            )
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: corsHeaders }
    )
  } catch (error) {
    console.error('General error in db-utils:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
