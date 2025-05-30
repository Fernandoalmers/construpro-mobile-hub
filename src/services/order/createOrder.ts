
import { supabaseService } from '../supabaseService';
import { toast } from '@/components/ui/sonner';
import { CreateOrderPayload, OrderResponse } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function createOrder(orderData: CreateOrderPayload): Promise<string | null> {
  try {
    console.log('=== Starting Order Creation ===');
    console.log('Raw order data received:', JSON.stringify(orderData, null, 2));
    
    // Verify user session before making the request
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No valid session found:', sessionError);
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      throw new Error('Sessão de autenticação inválida ou expirada');
    }
    
    console.log('Valid session found for user:', session.user.id);
    
    // Validate required order data
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Itens do pedido são obrigatórios');
    }
    
    if (!orderData.endereco_entrega) {
      throw new Error('Endereço de entrega é obrigatório');
    }
    
    if (!orderData.valor_total || orderData.valor_total <= 0) {
      throw new Error('Valor total deve ser maior que zero');
    }
    
    // Prepare order data with correct structure matching Edge Function expectations
    const orderPayload = {
      action: 'create_order', // Required action field for Edge Function routing
      items: orderData.items.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.subtotal || item.preco * item.quantidade,
        pontos: item.produto?.pontos || 0
      })),
      endereco_entrega: {
        rua: orderData.endereco_entrega.rua || '',
        numero: orderData.endereco_entrega.numero || '',
        complemento: orderData.endereco_entrega.complemento || '',
        bairro: orderData.endereco_entrega.bairro || '',
        cidade: orderData.endereco_entrega.cidade || '',
        estado: orderData.endereco_entrega.estado || '',
        cep: orderData.endereco_entrega.cep || '',
        ponto_referencia: orderData.endereco_entrega.ponto_referencia || ''
      },
      forma_pagamento: orderData.forma_pagamento,
      valor_total: Number(orderData.valor_total),
      pontos_ganhos: Number(orderData.pontos_ganhos || 0),
      cupom_aplicado: orderData.cupom_aplicado ? {
        id: orderData.cupom_aplicado.code, // Use code as id for now
        code: orderData.cupom_aplicado.code,
        discount: Number(orderData.cupom_aplicado.discount || 0)
      } : null,
      desconto: Number(orderData.desconto || 0),
      status: 'Confirmado'
    };
    
    console.log('=== Prepared Order Payload ===');
    console.log('Payload to send:', JSON.stringify(orderPayload, null, 2));
    console.log('Payload size (bytes):', JSON.stringify(orderPayload).length);
    
    // Validate payload before sending
    if (!orderPayload.action) {
      throw new Error('Action field is missing from payload');
    }
    
    if (!orderPayload.items || orderPayload.items.length === 0) {
      throw new Error('Items are missing from payload');
    }
    
    console.log('=== Sending Request to Edge Function ===');
    
    // Use the supabaseService helper with built-in retry logic
    const { data, error } = await supabaseService.invokeFunction('order-processing', {
      method: 'POST',
      body: orderPayload,
      maxRetries: 1,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('=== Edge Function Response ===');
    console.log('Response data:', data);
    console.log('Response error:', error);
    
    // Check for error in the response
    if (error) {
      console.error('=== Edge Function Error ===');
      console.error('Error details:', error);
      
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
      console.error('=== Invalid Response ===');
      console.error('Data received:', data);
      
      throw new Error(errorMsg);
    }
    
    console.log('=== Order Creation Successful ===');
    console.log('Order ID:', data.order.id);
    
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
    console.log("=== Order Creation Complete ===");
    console.log("Order ID returned:", data.order.id);
    return data.order.id;
  } catch (error: any) {
    console.error("=== Error in createOrder ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
