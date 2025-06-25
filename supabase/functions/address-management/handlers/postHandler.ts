
import { createSuccessResponse, createErrorResponse } from '../utils.ts';

export async function handlePost(req: Request, context: any) {
  try {
    const body = await req.json();
    console.log('[address-management] POST request with body:', body);
    
    // For now, return a simple success response
    // In a real implementation, you would save the address to the database
    const savedAddress = {
      id: crypto.randomUUID(),
      ...body,
      created_at: new Date().toISOString()
    };
    
    return createSuccessResponse({ address: savedAddress });
  } catch (error) {
    console.error('[address-management] POST error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
