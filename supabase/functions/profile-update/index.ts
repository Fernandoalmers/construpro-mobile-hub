
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type UserRole = 'consumidor' | 'profissional' | 'lojista' | 'vendedor';

interface Profile {
  id?: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  papel?: UserRole;
  tipo_perfil?: UserRole;
  saldo_pontos?: number;
  status?: string;
  avatar?: string;
  codigo?: string;
  created_at?: string;
  updated_at?: string;
  endereco_principal?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}

serve(async (req) => {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    }
    
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }

    // Verify request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    // Client with JWT token (from user)
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
        { status: 401, headers }
      )
    }
    
    // Get update data from request body
    const requestData: Profile = await req.json()
    
    // Create a clean update object (preventing unauthorized updates)
    const updateData: Record<string, any> = {}
    
    // Only allow certain fields to be updated
    const allowedFields = [
      'nome', 'cpf', 'telefone', 'papel', 'tipo_perfil', 'avatar', 'status', 'codigo'
    ]
    
    allowedFields.forEach(field => {
      if (field in requestData) {
        updateData[field] = requestData[field]
      }
    })
    
    // Handle nested endereco_principal
    if (requestData.endereco_principal) {
      updateData.endereco_principal = requestData.endereco_principal
    }
    
    // Ensure tipo_perfil and papel are in sync
    if (requestData.papel && !requestData.tipo_perfil) {
      updateData.tipo_perfil = requestData.papel
    }
    
    if (requestData.tipo_perfil && !requestData.papel) {
      updateData.papel = requestData.tipo_perfil
    }
    
    // If no valid data to update
    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers }
      )
    }
    
    // Update profile
    const { data: profile, error: updateError } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()
      
    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers }
      )
    }
    
    // Return updated profile
    return new Response(
      JSON.stringify({
        success: true,
        data: profile
      }),
      { status: 200, headers }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})
