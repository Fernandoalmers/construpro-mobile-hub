
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
            subtotal: item.subtotal || item.preco * item.quantidade
          })),
          endereco_entrega: orderData.endereco_entrega,
          forma_pagamento: orderData.forma_pagamento,
          valor_total: orderData.valor_total,
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
      
      const { data, error } = await supabaseService.invokeFunction('order-processing', {
        method: 'GET',
        maxRetries: 2
      });
      
      if (error) {
        console.error("❌ [orderService.getOrders] Error fetching orders:", error);
        toast.error("Não foi possível carregar seus pedidos", {
          description: error.message
        });
        throw error;
      }
      
      if (!data?.success) {
        const errorMsg = data?.error || 'Erro ao buscar pedidos';
        console.error("❌ [orderService.getOrders] Error in response:", errorMsg);
        toast.error("Erro ao carregar pedidos", {
          description: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      const orders = data?.orders || [];
      console.log(`✅ [orderService.getOrders] Retrieved ${orders.length} orders`);
      
      // If we have orders, log a sample to help with debugging
      if (orders.length > 0) {
        console.log("📊 [orderService.getOrders] Sample order:", {
          id: orders[0].id,
          status: orders[0].status,
          items: orders[0].order_items?.length || 0,
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
      
      const { data, error } = await supabaseService.invokeFunction('order-processing', {
        method: 'GET',
        body: { orderId },
        headers: {
          'content-type': 'application/json'
        },
        maxRetries: 2
      });
      
      if (error) {
        console.error("❌ [orderService.getOrderById] Error fetching order:", error);
        toast.error("Erro ao carregar detalhes do pedido", {
          description: error.message
        });
        throw error;
      }
      
      if (!data?.success) {
        const errorMsg = data?.error || 'Erro ao buscar detalhes do pedido';
        console.error("❌ [orderService.getOrderById] Error in response:", errorMsg);
        toast.error("Erro ao carregar detalhes", {
          description: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      const order = data?.order || null;
      
      if (order) {
        console.log(`✅ [orderService.getOrderById] Successfully retrieved order ${orderId}`);
        console.log(`📊 [orderService.getOrderById] Order has ${order.order_items?.length || 0} items`);
      } else {
        console.log(`⚠️ [orderService.getOrderById] No order found with ID ${orderId}`);
      }
      
      return order;
    } catch (error: any) {
      console.error("❌ [orderService.getOrderById] Error:", error);
      toast.error("Erro ao carregar detalhes do pedido", {
        description: error.message || "Tente novamente mais tarde"
      });
      return null;
    }
  }
};
