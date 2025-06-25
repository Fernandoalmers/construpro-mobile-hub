
import { RequestContext } from '../types.ts';
import { createErrorResponse, createSuccessResponse } from '../utils.ts';

export async function handleDelete(req: Request, context: RequestContext): Promise<Response> {
  const { supabaseClient, user, corsHeaders } = context;
  
  const body = await req.json();
  const { id } = body;

  if (!id) {
    console.error('[address-management] DELETE request missing address ID');
    return createErrorResponse('Address ID is required', 400, corsHeaders);
  }

  console.log('[address-management] Deleting address:', { id, user_id: user.id });

  const { error } = await supabaseClient
    .from('user_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[address-management] Error deleting address:', error);
    return createErrorResponse(error.message, 400, corsHeaders);
  }

  console.log('[address-management] Address deleted successfully');
  return createSuccessResponse({ success: true }, corsHeaders);
}
