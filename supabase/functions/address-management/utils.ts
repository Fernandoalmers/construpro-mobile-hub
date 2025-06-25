
import { RequestContext } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function createRequestContext(req: Request): Promise<RequestContext> {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    console.error('[address-management] User authentication failed:', userError);
    throw new Error('Unauthorized');
  }

  return {
    supabaseClient,
    user,
    corsHeaders,
  };
}

export function createErrorResponse(message: string, status: number, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function createSuccessResponse(data: any, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
