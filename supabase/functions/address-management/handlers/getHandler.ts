
import { RequestContext } from '../types.ts';
import { createErrorResponse, createSuccessResponse } from '../utils.ts';

export async function handleGet(req: Request, context: RequestContext): Promise<Response> {
  const { supabaseClient, user, corsHeaders } = context;
  const url = new URL(req.url);
  const addressId = url.searchParams.get('id');

  console.log(`[address-management] GET request for user: ${user.id}`, { addressId });

  if (addressId) {
    // Get specific address
    const { data: address, error } = await supabaseClient
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[address-management] Error fetching single address:', error);
      return createErrorResponse(error.message, 404, corsHeaders);
    }

    console.log('[address-management] Single address fetched successfully:', address.id);
    return createSuccessResponse({ address }, corsHeaders);
  } else {
    // Get all addresses for user
    const { data: addresses, error } = await supabaseClient
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[address-management] Error fetching addresses:', error);
      return createErrorResponse(error.message, 500, corsHeaders);
    }

    console.log(`[address-management] Fetched ${addresses?.length || 0} addresses for user`);
    return createSuccessResponse({ addresses: addresses || [] }, corsHeaders);
  }
}
