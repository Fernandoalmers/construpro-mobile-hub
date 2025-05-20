
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
}

// This is a utility function to help with database operations
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
    
    const { method, action, sql } = await req.json()
    
    if (method === 'POST') {
      if (action === 'execute-sql' && sql) {
        // Execute the provided SQL statement
        const { data, error } = await supabaseAdmin.rpc('execute_custom_sql', {
          sql_statement: sql
        })
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
          )
        }
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: corsHeaders }
        )
      }
      
      if (action === 'create-transaction-support-functions') {
        // Create database functions for transaction support
        const { error } = await supabaseAdmin.rpc('create_transaction_support_functions')
        
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: corsHeaders }
          )
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: corsHeaders }
        )
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: corsHeaders }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
