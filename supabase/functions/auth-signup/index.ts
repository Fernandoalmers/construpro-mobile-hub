
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  email: string;
  password: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  tipo_perfil: "consumidor" | "profissional" | "vendedor" | "lojista";
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { email, password, nome, cpf, telefone, tipo_perfil } = await req.json() as SignupRequest;

    // Validate required fields
    if (!email || !password || !nome || !tipo_perfil) {
      return new Response(
        JSON.stringify({ 
          error: "Campos obrigatórios não fornecidos" 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check if tipo_perfil is valid
    if (!["consumidor", "profissional", "vendedor", "lojista"].includes(tipo_perfil)) {
      return new Response(
        JSON.stringify({ 
          error: "Tipo de perfil inválido" 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          tipo_perfil,
          papel: tipo_perfil, // Adicionando papel para compatibilidade
          cpf,
          telefone,
          status: 'aguardando_aprovacao'
        }
      }
    });

    if (authError) {
      console.error("Erro ao criar usuário:", authError);
      return new Response(
        JSON.stringify({ 
          error: authError.message 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // O perfil será criado automaticamente pelo trigger 'handle_new_user'

    return new Response(
      JSON.stringify({
        message: "Usuário criado com sucesso. Aguardando aprovação.",
        user: authData.user
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Erro no servidor:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
