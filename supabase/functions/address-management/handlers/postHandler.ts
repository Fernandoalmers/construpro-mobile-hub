
import { RequestContext } from '../types.ts';
import { createErrorResponse, createSuccessResponse } from '../utils.ts';

export async function handlePost(req: Request, context: RequestContext): Promise<Response> {
  const { supabaseClient, user, corsHeaders } = context;
  
  const body = await req.json();
  console.log('[address-management] Creating address:', { ...body, user_id: user.id });
  
  const { data: address, error } = await supabaseClient
    .from('user_addresses')
    .insert({
      ...body,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('[address-management] Error creating address:', error);
    return createErrorResponse(error.message, 400, corsHeaders);
  }

  console.log('[address-management] Address created successfully:', address.id);
  return createSuccessResponse({ address }, corsHeaders);
}
