
import { supabaseService } from '../supabaseService';
import { toast } from '@/components/ui/sonner';
import { CreateOrderPayload, OrderResponse } from './types';
import { supabase } from '@/integrations/supabase/client';

export async function createOrder(orderData: CreateOrderPayload): Promise<string | null> {
  try {
    console.log('=== Starting Order Creation ===');
    console.log('Raw order data received:', orderData);
    
    // Enhanced session verification with retry
    console.log('=== Verifying User Session ===');
    let session = null;
    let sessionError = null;
    
    // Try to get session, with one refresh attempt if needed
    ({ data: { session }, error: sessionError } = await supabase.auth.getSession());
    
    if (sessionError || !session) {
      console.warn('Initial session check failed, attempting refresh...', sessionError);
      
      // Try refreshing the session once
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError) {
        // Try getting session again after refresh
        ({ data: { session }, error: sessionError } = await supabase.auth.getSession());
      }
      
      if (sessionError || !session) {
        console.error('Session verification failed after refresh:', sessionError);
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        throw new Error('Sessão de autenticação inválida ou expirada');
      }
    }
    
    console.log('✅ Valid session found for user:', session.user.id);
    
    // Enhanced validation with detailed logging
    console.log('=== Validating Order Data ===');
    console.log('Items count:', orderData.items?.length);
    console.log('Address provided:', !!orderData.endereco_entrega);
    console.log('Order total:', orderData.valor_total);
    
    if (!orderData.items || orderData.items.length === 0) {
      console.error('❌ Validation failed: No items in order');
      throw new Error('Itens do pedido são obrigatórios');
    }
    
    if (!orderData.endereco_entrega) {
      console.error('❌ Validation failed: No delivery address');
      throw new Error('Endereço de entrega é obrigatório');
    }
    
    // Validate address completeness
    const addr = orderData.endereco_entrega;
    if (!addr.rua || !addr.cidade || !addr.estado || !addr.cep) {
      console.error('❌ Address validation failed:', {
        rua: !!addr.rua,
        cidade: !!addr.cidade,
        estado: !!addr.estado,
        cep: !!addr.cep
      });
      throw new Error('Endereço de entrega incompleto - campos obrigatórios em falta');
    }
    
    if (!orderData.valor_total || orderData.valor_total <= 0) {
      console.error('❌ Validation failed: Invalid total value:', orderData.valor_total);
      throw new Error('Valor total deve ser maior que zero');
    }
    
    console.log('✅ All order data validations passed');
    
    // Prepare order data to match edge function's expected structure: { orderData, items }
    const orderPayload = {
      orderData: {
        cliente_id: session.user.id,
        valor_total: Number(orderData.valor_total),
        status: 'Confirmado',
        forma_pagamento: orderData.forma_pagamento,
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
        pontos_ganhos: Number(orderData.pontos_ganhos || 0),
        cupom_codigo: orderData.cupom_aplicado?.code || null,
        desconto_aplicado: Number(orderData.desconto || 0),
        reference_id: null
      },
      items: orderData.items.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.subtotal || item.preco * item.quantidade
      }))
    };
    
    console.log('=== Prepared Order Payload ===');
    console.log('Payload object:', orderPayload);
    console.log('Payload is object:', typeof orderPayload === 'object');
    console.log('Payload cliente_id:', orderPayload.orderData.cliente_id);
    console.log('Payload items count:', orderPayload.items.length);
    
    // Validate payload structure before sending
    if (!orderPayload.orderData.cliente_id) {
      throw new Error('Cliente ID is missing from payload');
    }
    
    if (!orderPayload.items || orderPayload.items.length === 0) {
      throw new Error('Items are missing from payload');
    }
    
    console.log('=== Sending Request to Edge Function ===');
    console.log('Calling supabaseService.invokeFunction with payload as JavaScript object');
    
    // Use the supabaseService helper - pass body as JavaScript object
    const { data, error } = await supabaseService.invokeFunction('order-processing', {
      method: 'POST',
      body: orderPayload, // Pass as JavaScript object, not JSON string
      maxRetries: 1
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
          
          if (retryResult.data?.success && retryResult.data?.orderId) {
            return retryResult.data.orderId;
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
    if (!data?.success || !data?.orderId) {
      const errorMsg = data?.error || 'Resposta inválida do servidor';
      console.error('=== Invalid Response ===');
      console.error('Data received:', data);
      
      throw new Error(errorMsg);
    }
    
    console.log('=== Order Creation Successful ===');
    console.log('Order ID:', data.orderId);
    
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
    console.log("Order ID returned:", data.orderId);
    return data.orderId;
  } catch (error: any) {
    console.error("=== Error in createOrder ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
