
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, createRequestContext, createErrorResponse } from './utils.ts';
import { handleGet } from './handlers/getHandler.ts';
import { handlePost } from './handlers/postHandler.ts';
import { handlePut } from './handlers/putHandler.ts';
import { handleDelete } from './handlers/deleteHandler.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`[address-management] ${req.method} request received`);
    
    // Criar contexto da requisição com autenticação
    const context = await createRequestContext(req);
    console.log(`[address-management] Context created for user: ${context.user.id}`);

    const method = req.method;

    switch (method) {
      case 'GET':
        return await handleGet(req, context);
      case 'POST':
        return await handlePost(req, context);
      case 'PUT':
        return await handlePut(req, context);
      case 'DELETE':
        return await handleDelete(req, context);
      default:
        console.log('[address-management] Method not allowed:', method);
        return createErrorResponse('Method not allowed', 405, corsHeaders);
    }

  } catch (error) {
    console.error('[address-management] Request processing error:', error);
    
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401, corsHeaders);
    }
    
    return createErrorResponse('Internal server error: ' + error.message, 500, corsHeaders);
  }
});
