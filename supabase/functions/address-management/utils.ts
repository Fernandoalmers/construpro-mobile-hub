
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function createSuccessResponse(data: any, headers: Record<string, string> = {}) {
  return new Response(
    JSON.stringify({ success: true, data }),
    {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...headers
      }
    }
  );
}

export function createErrorResponse(message: string, status: number = 400, headers: Record<string, string> = {}) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...headers
      }
    }
  );
}

export async function createRequestContext(req: Request) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Criar cliente Supabase para a função
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Verificar e obter usuário do token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    console.error('[address-management] Auth error:', userError);
    throw new Error('Unauthorized');
  }

  console.log('[address-management] Authenticated user:', user.id);

  return {
    user,
    supabase,
    token
  };
}
