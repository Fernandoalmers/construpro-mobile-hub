
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
      console.log("Creating order with data:", orderData);
      
      // Use the order-processing edge function to create the order
      const { data, error } = await supabase.functions.invoke('order-processing', {
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
        }
      });
      
      if (error) {
        console.error("Error creating order:", error);
        const errorMsg = error.message || 'Falha ao criar pedido';
        toast.error("Erro no processamento do pedido", { 
          description: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      if (!data?.success || !data?.order?.id) {
        const errorMsg = data?.error || 'Resposta inválida do servidor';
        console.error("Invalid response from server:", data);
        toast.error("Erro de resposta", { 
          description: errorMsg
        });
        throw new Error(errorMsg);
      }
      
      console.log("Order created successfully:", data.order);
      return data.order.id;
    } catch (error: any) {
      console.error("Error in createOrder:", error);
      // Don't show toast here because it's already shown in the checkout component
      throw error;
    }
  },
  
  async getOrders(): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('order-processing');
      
      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
      
      return data?.orders || [];
    } catch (error) {
      console.error("Error in getOrders:", error);
      return [];
    }
  },
  
  async getOrderById(orderId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('order-processing', {
        headers: {
          path: `/order-processing/${orderId}`
        }
      });
      
      if (error) {
        console.error("Error fetching order:", error);
        throw error;
      }
      
      return data?.order || null;
    } catch (error) {
      console.error("Error in getOrderById:", error);
      return null;
    }
  }
};
