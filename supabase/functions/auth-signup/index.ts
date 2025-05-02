
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type UserRole = 'consumidor' | 'profissional' | 'lojista' | 'vendedor';

interface SignupData {
  email: string;
  password: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  tipo_perfil: UserRole;
}

serve(async (req) => {
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
  
  // Check if method is POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  }
  
  try {
    // Parse request body
    const userData: SignupData = await req.json()
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.nome) {
      return new Response(
        JSON.stringify({ error: 'Email, senha e nome são obrigatórios' }),
        { status: 400, headers }
      )
    }
    
    // Set default role if not provided
    if (!userData.tipo_perfil) {
      userData.tipo_perfil = 'consumidor';
    }
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Create user with metadata
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        nome: userData.nome,
        cpf: userData.cpf,
        telefone: userData.telefone,
        tipo_perfil: userData.tipo_perfil,
        papel: userData.tipo_perfil,
        status: 'ativo'
      }
    })
    
    if (error) {
      let statusCode = 500
      let errorMessage = error.message
      
      // Handle specific error cases
      if (error.message.includes('already registered')) {
        statusCode = 409
        errorMessage = 'Este email já está cadastrado'
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: statusCode, headers }
      )
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        user: data.user
      }),
      { status: 201, headers }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    )
  }
})
