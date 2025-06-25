
import { RequestContext } from '../types.ts';
import { createErrorResponse, createSuccessResponse } from '../utils.ts';

export async function handlePut(req: Request, context: RequestContext): Promise<Response> {
  const { supabaseClient, user, corsHeaders } = context;
  
  const body = await req.json();
  const { id, ...updateData } = body;

  if (!id) {
    console.error('[address-management] PUT request missing address ID');
    return createErrorResponse('Address ID is required', 400, corsHeaders);
  }

  console.log('[address-management] Updating address:', { id, updateData, user_id: user.id });

  // Handle principal address updates with atomic operation
  if (updateData.principal === true) {
    return await handlePrincipalUpdate(id, updateData, context);
  } else {
    return await handleRegularUpdate(id, updateData, context);
  }
}

async function handlePrincipalUpdate(id: string, updateData: any, context: RequestContext): Promise<Response> {
  const { supabaseClient, user, corsHeaders } = context;
  
  console.log('[address-management] Setting address as principal with atomic operation:', id);
  
  try {
    // 1. Verify address exists and belongs to user
    const { data: existingAddress, error: verifyError } = await supabaseClient
      .from('user_addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (verifyError || !existingAddress) {
      console.error('[address-management] Address not found or unauthorized:', verifyError);
      return createErrorResponse('Address not found or unauthorized', 404, corsHeaders);
    }

    console.log('[address-management] Address verified, updating as principal');

    // 2. Atomic operation: Clear other principal addresses first
    const { error: clearError } = await supabaseClient
      .from('user_addresses')
      .update({ 
        principal: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .neq('id', id);

    if (clearError) {
      console.error('[address-management] Error clearing other principal addresses:', clearError);
      return createErrorResponse(`Failed to clear other addresses: ${clearError.message}`, 500, corsHeaders);
    }

    // 3. Set this address as principal
    const { data: updatedAddress, error: updateError } = await supabaseClient
      .from('user_addresses')
      .update({ 
        ...updateData, 
        principal: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[address-management] Error setting address as principal:', updateError);
      return createErrorResponse(`Failed to set as principal: ${updateError.message}`, 400, corsHeaders);
    }

    console.log('[address-management] Address successfully set as principal:', updatedAddress.id);

    // 4. Verification: confirm only one address is principal
    const { data: verification, error: verifyFinalError } = await supabaseClient
      .from('user_addresses')
      .select('id, nome, principal')
      .eq('user_id', user.id)
      .eq('principal', true);

    if (!verifyFinalError && verification) {
      console.log('[address-management] Verification - principal addresses:', verification.length, verification.map(a => a.id));
      
      if (verification.length !== 1 || verification[0].id !== id) {
        console.error('[address-management] Verification failed - incorrect principal state');
        return createErrorResponse('Database integrity error: multiple principal addresses found', 500, corsHeaders);
      }
    }

    return createSuccessResponse({ address: updatedAddress }, corsHeaders);

  } catch (transactionError) {
    console.error('[address-management] Transaction error:', transactionError);
    return createErrorResponse('Failed to update principal address due to database error', 500, corsHeaders);
  }
}

async function handleRegularUpdate(id: string, updateData: any, context: RequestContext): Promise<Response> {
  const { supabaseClient, user, corsHeaders } = context;
  
  const { data: address, error } = await supabaseClient
    .from('user_addresses')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[address-management] Error updating address:', error);
    return createErrorResponse(error.message, 400, corsHeaders);
  }

  console.log('[address-management] Address updated successfully:', address.id);
  return createSuccessResponse({ address }, corsHeaders);
}
