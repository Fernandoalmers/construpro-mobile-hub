
import { createSuccessResponse, createErrorResponse } from '../utils.ts';

export async function handleGet(req: Request, context: any) {
  try {
    console.log('[address-management] GET request - returning mock addresses for now');
    
    // For now, return a simple success response
    // In a real implementation, you would fetch addresses from the database
    const mockAddresses = [
      {
        id: '1',
        nome: 'Casa',
        cep: '12345678',
        logradouro: 'Rua Exemplo',
        numero: '123',
        bairro: 'Centro',
        cidade: 'Cidade',
        estado: 'SP',
        principal: true
      }
    ];
    
    return createSuccessResponse({ addresses: mockAddresses });
  } catch (error) {
    console.error('[address-management] GET error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
