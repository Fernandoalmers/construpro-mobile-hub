
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
          status: 'confirmado'
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
      const { data, error } = await supabaseService.invokeFunction('order-processing', {
        method: 'GET'
      });
      
      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Não foi possível carregar seus pedidos", {
          description: error.message
        });
        throw error;
      }
      
      if (!data?.success) {
        const errorMsg = data?.error || 'Erro ao buscar pedidos';
        console.error("Error in response:", errorMsg);
        toast.error("Erro ao carregar pedidos", {
          description: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      return data?.orders || [];
    } catch (error: any) {
      console.error("Error in getOrders:", error);
      toast.error("Erro ao carregar pedidos", {
        description: error.message || "Tente novamente mais tarde"
      });
      return [];
    }
  },
  
  async getOrderById(orderId: string): Promise<any> {
    try {
      const { data, error } = await supabaseService.invokeFunction('order-processing', {
        method: 'GET',
        body: { orderId },
        headers: {
          'content-type': 'application/json'
        }
      });
      
      if (error) {
        console.error("Error fetching order:", error);
        toast.error("Erro ao carregar detalhes do pedido", {
          description: error.message
        });
        throw error;
      }
      
      if (!data?.success) {
        const errorMsg = data?.error || 'Erro ao buscar detalhes do pedido';
        console.error("Error in response:", errorMsg);
        toast.error("Erro ao carregar detalhes", {
          description: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      return data?.order || null;
    } catch (error: any) {
      console.error("Error in getOrderById:", error);
      toast.error("Erro ao carregar detalhes do pedido", {
        description: error.message || "Tente novamente mais tarde"
      });
      return null;
    }
  }
};
