
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

interface PointsTransaction {
  pontos: number;
  tipo: 'compra' | 'resgate' | 'indicacao' | 'loja-fisica' | 'servico';
  referencia_id?: string;
  descricao: string;
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
      return new Response(
        JSON.stringify({ error: authError?.message || 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }
    
    // GET /points-management - Get points balance and transaction history
    if (req.method === 'GET') {
      // Get user points balance
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('saldo_pontos')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        return new Response(
          JSON.stringify({ error: profileError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      // Get transaction history
      const { data: transactions, error: transactionsError } = await supabaseClient
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
      
      if (transactionsError) {
        return new Response(
          JSON.stringify({ error: transactionsError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      return new Response(
        JSON.stringify({
          saldo_pontos: profile.saldo_pontos,
          transactions
        }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // POST /points-management - Add points transaction
    // Note: This would typically be called by other server functions, not directly by the client
    if (req.method === 'POST') {
      const transactionData: PointsTransaction = await req.json()
      
      // Validate required fields
      if (!transactionData.pontos || !transactionData.tipo || !transactionData.descricao) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: pontos, tipo, descricao' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Start a transaction to ensure atomicity
      const { error: transactionError } = await supabaseClient.rpc('begin_transaction')
      if (transactionError) {
        return new Response(
          JSON.stringify({ error: transactionError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      try {
        // Add transaction record
        const { error: insertError } = await supabaseClient
          .from('points_transactions')
          .insert({
            user_id: user.id,
            ...transactionData
          })
        
        if (insertError) throw new Error(insertError.message)
        
        // Update user balance
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('saldo_pontos')
          .eq('id', user.id)
          .single()
        
        if (profileError) throw new Error(profileError.message)
        
        const newBalance = (profile.saldo_pontos || 0) + transactionData.pontos
        if (newBalance < 0) throw new Error('Insufficient points balance')
        
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ saldo_pontos: newBalance })
          .eq('id', user.id)
        
        if (updateError) throw new Error(updateError.message)
        
        // Commit transaction
        await supabaseClient.rpc('commit_transaction')
        
        return new Response(
          JSON.stringify({
            success: true,
            new_balance: newBalance
          }),
          { status: 201, headers: corsHeaders }
        )
      } catch (error) {
        // Rollback transaction
        await supabaseClient.rpc('rollback_transaction')
        
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: corsHeaders }
        )
      }
    }
    
    // If the request doesn't match any of the above conditions
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
