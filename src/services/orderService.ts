
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { CartItem } from '@/types/cart';
import { Address } from './addressService';
import { supabaseService } from './supabaseService';

export interface CreateOrderPayload {
  items: CartItem[];
  endereco_entrega: Address;
  forma_pagamento: string;
  valor_total: number;
  pontos_ganhos: number;
}

export const orderService = {
  async createOrder(orderData: CreateOrderPayload): Promise<string | null> {
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
      
      // Success!
      console.log("Order created successfully:", data.order);
      return data.order.id;
    } catch (error: any) {
      console.error("Error in createOrder:", error);
      // Re-throw the error to be handled by the caller
      throw error;
    }
  },
  
  async getOrders(): Promise<any[]> {
    try {
      console.log("🔍 [orderService.getOrders] Fetching orders for current user");
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          cliente_id, 
          valor_total, 
          pontos_ganhos,
          status, 
          forma_pagamento, 
          endereco_entrega,
          created_at,
          updated_at,
          rastreio
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("❌ [orderService.getOrders] Error fetching orders:", error);
        toast.error("Não foi possível carregar seus pedidos", {
          description: error.message
        });
        throw error;
      }
      
      if (!data) {
        console.error("❌ [orderService.getOrders] No data returned");
        return [];
      }
      
      const orders = data || [];
      console.log(`✅ [orderService.getOrders] Retrieved ${orders.length} orders`);
      
      // If we have orders, log a sample to help with debugging
      if (orders.length > 0) {
        console.log("📊 [orderService.getOrders] Sample order:", {
          id: orders[0].id,
          status: orders[0].status,
          created_at: orders[0].created_at
        });
      } else {
        console.log("⚠️ [orderService.getOrders] No orders found");
      }
      
      return orders;
    } catch (error: any) {
      console.error("❌ [orderService.getOrders] Error:", error);
      toast.error("Erro ao carregar pedidos", {
        description: error.message || "Tente novamente mais tarde"
      });
      return [];
    }
  },
  
  async getOrderById(orderId: string): Promise<any> {
    try {
      console.log(`🔍 [orderService.getOrderById] Fetching order details for ID: ${orderId}`);
      
      // We will directly try the alternative method that uses the edge function
      return await this.getOrderByIdAlternative(orderId);
      
    } catch (error: any) {
      console.error("❌ [orderService.getOrderById] Error:", error);
      
      toast.error("Erro ao carregar detalhes do pedido", {
        description: error.message || "Tente novamente mais tarde"
      });
      throw error; // Re-throw to be handled by the component
    }
  },
  
  // Método alternativo para buscar pedido
  async getOrderByIdAlternative(orderId: string): Promise<any> {
    try {
      console.log(`🔍 [orderService.getOrderByIdAlternative] Using alternative method for order ID: ${orderId}`);
      
      // Buscar direto do service function para contornar limitações de RLS
      const { data, error } = await supabaseService.invokeFunction('order-processing', {
        method: 'GET',
        headers: {
          // Add a custom header for passing the order ID
          'x-order-id': orderId
        },
        maxRetries: 5  // Increase retries for better reliability
      });
      
      if (error) {
        console.error("❌ [orderService.getOrderByIdAlternative] Error in service function:", error);
        throw error;
      }
      
      if (!data || !data.order) {
        console.error(`⚠️ [orderService.getOrderByIdAlternative] No order data returned for ID ${orderId}`);
        throw new Error('Pedido não encontrado');
      }
      
      console.log(`✅ [orderService.getOrderByIdAlternative] Successfully retrieved order data:`, data.order);
      return data.order;
    } catch (error: any) {
      console.error("❌ [orderService.getOrderByIdAlternative] Alternative method failed:", error);
      
      // Provide more helpful error message for network issues
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('Failed to send') || 
          error.message?.includes('network') ||
          error.message?.includes('connection')) {
        throw new Error('Erro de conexão com o servidor. Por favor, verifique sua conexão e tente novamente.');
      }
      
      throw error;
    }
  }
};
