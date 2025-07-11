
import { createSuccessResponse, createErrorResponse } from '../utils.ts';

export async function handleGet(req: Request, context: any) {
  try {
    console.log('[address-management] GET request for user:', context.user.id);
    
    // Buscar endereços do usuário
    const { data: addresses, error } = await context.supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[address-management] Error fetching addresses:', error);
      return createErrorResponse('Erro ao buscar endereços: ' + error.message, 500);
    }

    console.log('[address-management] Found addresses:', addresses?.length || 0);
    
    return createSuccessResponse({ addresses: addresses || [] });
    
  } catch (error) {
    console.error('[address-management] GET error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
