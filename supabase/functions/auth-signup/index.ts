
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
  especialidade_profissional?: string;
  nome_loja?: string;
}

serve(async (req) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
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
    console.log("Auth signup function called");
    
    // Parse request body
    let userData: SignupData;
    try {
      userData = await req.json();
      console.log("Received signup data:", { 
        email: userData.email, 
        nome: userData.nome,
        tipo_perfil: userData.tipo_perfil,
        especialidade_profissional: userData.especialidade_profissional,
        nome_loja: userData.nome_loja
      });
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers }
      );
    }
    
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers }
      );
    }

    console.log("Initializing Supabase client for auth-signup");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Prepare user metadata with all required fields
    const userMetadata = {
      nome: userData.nome,
      cpf: userData.cpf || null,
      telefone: userData.telefone || null,
      tipo_perfil: userData.tipo_perfil,
      papel: userData.tipo_perfil, // For backward compatibility
      status: 'ativo',
      saldo_pontos: 0
    };

    // Add specific fields based on profile type
    if (userData.tipo_perfil === 'profissional' && userData.especialidade_profissional) {
      userMetadata.especialidade_profissional = userData.especialidade_profissional;
    }

    if (userData.tipo_perfil === 'vendedor' && userData.nome_loja) {
      userMetadata.nome_loja = userData.nome_loja;
    }

    console.log("Creating user with metadata:", userMetadata);
    
    // Create user with metadata
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userMetadata
    });
    
    if (error) {
      console.error("Error creating user:", error);
      let statusCode = 500;
      let errorMessage = error.message;
      
      // Handle specific error cases
      if (error.message.includes('already registered')) {
        statusCode = 409;
        errorMessage = 'Este email já está cadastrado';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: statusCode, headers }
      );
    }

    console.log("User created successfully:", data.user?.id);

    // Create profile directly to ensure it exists
    if (data.user) {
      try {
        const profileData = {
          id: data.user.id,
          nome: userData.nome,
          email: userData.email,
          cpf: userData.cpf || null,
          telefone: userData.telefone || null,
          papel: userData.tipo_perfil,
          tipo_perfil: userData.tipo_perfil,
          especialidade_profissional: userData.especialidade_profissional || null,
          status: 'ativo',
          saldo_pontos: 0
        };

        console.log("Creating profile directly:", profileData);

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Don't fail the signup if profile creation fails, the trigger should handle it
        } else {
          console.log("Profile created successfully");
        }
      } catch (profileCreateError) {
        console.error("Exception creating profile:", profileCreateError);
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        user: data.user
      }),
      { status: 201, headers }
    );
    
  } catch (error) {
    console.error("Unexpected error in auth-signup:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers }
    );
  }
});
