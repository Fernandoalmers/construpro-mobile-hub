
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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper sleep function for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const orderService = {
  async createOrder(orderData: CreateOrderPayload): Promise<string | null> {
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount < MAX_RETRIES) {
      try {
        console.log(`Attempt ${retryCount + 1} to create order with data:`, orderData);
        
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
        
        // Check for error in the response
        if (error) {
          console.error(`Attempt ${retryCount + 1} - Error creating order:`, error);
          const errorMsg = error.message || 'Falha ao criar pedido';
          lastError = new Error(errorMsg);
          
          // Only show toast on last retry
          if (retryCount === MAX_RETRIES - 1) {
            toast.error("Erro no processamento do pedido", { 
              description: `${errorMsg}. Por favor tente novamente.`
            });
          }
          
          throw lastError;
        }
        
        // Check for error in the returned data
        if (!data?.success || !data?.order?.id) {
          const errorMsg = data?.error || 'Resposta inválida do servidor';
          console.error(`Attempt ${retryCount + 1} - Invalid response:`, data);
          lastError = new Error(errorMsg);
          
          // Only show toast on last retry
          if (retryCount === MAX_RETRIES - 1) {
            toast.error("Erro de resposta", { 
              description: `${errorMsg}. Por favor tente novamente.`
            });
          }
          
          throw lastError;
        }
        
        // Success!
        console.log("Order created successfully:", data.order);
        return data.order.id;
      } catch (error: any) {
        lastError = error;
        retryCount++;
        
        // If not the last retry, wait before trying again
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms... (${retryCount}/${MAX_RETRIES})`);
          await sleep(RETRY_DELAY * retryCount); // Exponential backoff
        }
      }
    }
    
    // All retries failed
    console.error(`Failed to create order after ${MAX_RETRIES} attempts. Last error:`, lastError);
    throw lastError;
  },
  
  async getOrders(): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('order-processing');
      
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
      const { data, error } = await supabase.functions.invoke('order-processing', {
        headers: {
          path: `/order-processing/${orderId}`
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
