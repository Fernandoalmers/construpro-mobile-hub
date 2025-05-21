
import { supabaseService } from '../supabaseService';
import { toast } from '@/components/ui/sonner';
import { CreateOrderPayload, OrderResponse } from './types';

export async function createOrder(orderData: CreateOrderPayload): Promise<string | null> {
  try {
    console.log('Creating order with data:', orderData);
    
    // Use the supabaseService helper with built-in retry logic
    const { data, error } = await supabaseService.invokeFunction('order-processing', {
      method: 'POST',
      body: {
        items: orderData.items.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.subtotal || item.preco * item.quantidade,
          pontos: item.produto?.pontos || 0 // Pass points per product explicitly
        })),
        endereco_entrega: orderData.endereco_entrega,
        forma_pagamento: orderData.forma_pagamento,
        valor_total: orderData.valor_total,
        pontos_ganhos: orderData.pontos_ganhos, // Pass the accurate total points
        status: 'Confirmado'  // Capitalized to match database constraint
      },
      maxRetries: 3 // Increase retries for critical operations like order creation
    });
    
    // Check for error in the response
    if (error) {
      console.error('Error creating order:', error);
      
      // Enhanced error handling with specific error types
      if (error.message?.includes('row-level security policy')) {
        throw new Error('Erro de permissão: o sistema não conseguiu criar o pedido devido a restrições de segurança. Por favor, tente novamente em alguns instantes ou contate o suporte.');
      }
      
      if (error.message?.includes('network') || error.message?.includes('timeout') || error.message?.includes('connection')) {
        throw new Error('Erro de conexão: não conseguimos comunicar com o servidor. Verifique sua internet e tente novamente.');
      }
      
      throw new Error(error.message || 'Falha ao criar pedido');
    }
    
    // Check for error in the returned data
    if (!data?.success || !data?.order?.id) {
      const errorMsg = data?.error || 'Resposta inválida do servidor';
      console.error('Invalid response:', data);
      
      throw new Error(errorMsg);
    }
    
    // Add informative toast messages about inventory and points
    if (data.inventoryUpdated === false) {
      console.warn('Some inventory updates failed, but order was created');
      toast.warning('Pedido criado, mas algumas atualizações de estoque falharam. O administrador foi notificado.');
    }
    
    if (data.pointsRegistered === false) {
      console.warn('Points registration failed, but order was created');
      toast.warning('Pedido criado, mas houve um problema ao registrar seus pontos. O administrador foi notificado.');
    }
    
    // Success!
    console.log("Order created successfully:", data.order);
    return data.order.id;
  } catch (error: any) {
    console.error("Error in createOrder:", error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
