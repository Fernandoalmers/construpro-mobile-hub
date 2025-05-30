
import { supabaseService } from '../supabaseService';
import { toast } from '@/components/ui/sonner';
import { CreateOrderPayload, OrderResponse } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function createOrder(orderData: CreateOrderPayload): Promise<string | null> {
  try {
    console.log('Creating order with data:', orderData);
    
    // Verify user session before making the request
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No valid session found:', sessionError);
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      throw new Error('Sessão de autenticação inválida ou expirada');
    }
    
    console.log('Valid session found, proceeding with order creation');
    
    // Prepare order data with enhanced structure
    const orderPayload = {
      action: 'create_order',
      items: orderData.items.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.subtotal || item.preco * item.quantidade,
        pontos: item.produto?.pontos || 0
      })),
      endereco_entrega: orderData.endereco_entrega,
      forma_pagamento: orderData.forma_pagamento,
      valor_total: orderData.valor_total,
      pontos_ganhos: orderData.pontos_ganhos,
      cupom_aplicado: orderData.cupom_aplicado,
      desconto: orderData.desconto || 0,
      status: 'Confirmado'
    };
    
    console.log('Sending order payload:', orderPayload);
    
    // Use the supabaseService helper with built-in retry logic
    const { data, error } = await supabaseService.invokeFunction('order-processing', {
      method: 'POST',
      body: orderPayload,
      maxRetries: 1, // Reduce retries for faster feedback
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Check for error in the response
    if (error) {
      console.error('Error creating order:', error);
      
      // Enhanced error handling with specific error types
      if (error.message?.includes('Authentication') || error.message?.includes('authorization') || error.status === 401) {
        // Try to refresh the session and retry once
        console.log('Attempting to refresh session...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError) {
          console.log('Session refreshed, retrying order creation...');
          // Retry the request once with refreshed session
          const retryResult = await supabaseService.invokeFunction('order-processing', {
            method: 'POST',
            body: orderPayload,
            maxRetries: 0
          });
          
          if (retryResult.error) {
            throw new Error('Erro de autenticação: faça login novamente');
          }
          
          if (retryResult.data?.success && retryResult.data?.order?.id) {
            return retryResult.data.order.id;
          }
        }
        
        throw new Error('Sessão expirada: por favor, faça login novamente');
      }
      
      if (error.message?.includes('row-level security policy')) {
        throw new Error('Erro de permissão: não foi possível criar o pedido. Verifique se você está logado.');
      }
      
      if (error.message?.includes('network') || error.message?.includes('timeout') || error.message?.includes('connection')) {
        throw new Error('Erro de conexão: verifique sua internet e tente novamente.');
      }
      
      // Show more specific error message from the server
      const errorMessage = error.message || 'Falha ao criar pedido';
      throw new Error(errorMessage);
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
      toast.warning('Pedido criado, mas algumas atualizações de estoque falharam.');
    }
    
    if (data.pointsRegistered === false) {
      console.warn('Points registration failed, but order was created');
      toast.warning('Pedido criado, mas houve um problema ao registrar seus pontos.');
    } else {
      const pointsAmount = orderData.pontos_ganhos;
      if (pointsAmount > 0) {
        toast.success(`Você ganhou ${pointsAmount} pontos com esta compra!`);
      }
    }

    // Show coupon processing result
    if (data.couponProcessed === false && orderData.cupom_aplicado) {
      console.warn('Coupon processing failed, but order was created');
      toast.warning('Pedido criado, mas houve um problema ao processar o cupom.');
    } else if (orderData.cupom_aplicado && orderData.desconto > 0) {
      toast.success(`Cupom ${orderData.cupom_aplicado.code} aplicado com desconto de R$ ${orderData.desconto.toFixed(2)}!`);
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
