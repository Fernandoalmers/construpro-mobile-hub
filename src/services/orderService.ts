
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
      
      // Obter o pedido diretamente do banco de dados
      const { data: orderData, error: orderError } = await supabase
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
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error("❌ [orderService.getOrderById] Error fetching order:", orderError);
        throw orderError;
      }
      
      if (!orderData) {
        console.error(`⚠️ [orderService.getOrderById] No order found with ID ${orderId}`);
        throw new Error('Pedido não encontrado');
      }
      
      console.log(`✅ [orderService.getOrderById] Successfully retrieved order ${orderId}`, orderData);
      
      // Fetch order items directly from order_items table
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            order_id
          `)
          .eq('order_id', orderId);
          
        if (itemsError) {
          console.error("❌ [orderService.getOrderById] Error fetching order items:", itemsError);
          // Continue even if there's an error with items
        }
        
        // If we have items, fetch the product details for each item
        let itemsWithProducts = [];
        
        if (itemsData && itemsData.length > 0) {
          // Get all product IDs
          const productIds = itemsData.map(item => item.produto_id);
          
          // Fetch products in a single query - Note: We're not using imagem_url as it doesn't exist
          const { data: productsData, error: productsError } = await supabase
            .from('produtos')
            .select('id, nome, imagens, preco_normal, preco_promocional, descricao, categoria')
            .in('id', productIds);
            
          if (productsError) {
            console.error("❌ [orderService.getOrderById] Error fetching products:", productsError);
          }
          
          // Create a map of product ID to product data for quick lookup
          const productsMap: {[key: string]: any} = {};
          if (productsData) {
            productsData.forEach(product => {
              productsMap[product.id] = product;
            });
          }
          
          // Combine item data with product data
          itemsWithProducts = itemsData.map(item => {
            const productData = productsMap[item.produto_id] || null;
            
            // Extract image URL from product data if available
            let imageUrl = null;
            if (productData && productData.imagens && Array.isArray(productData.imagens) && productData.imagens.length > 0) {
              const firstImage = productData.imagens[0];
              if (typeof firstImage === 'string') {
                imageUrl = firstImage;
              } else if (firstImage && typeof firstImage === 'object') {
                imageUrl = firstImage.url || firstImage.path || null;
              }
            }
            
            return {
              ...item,
              produto: productData ? {
                ...productData,
                imagem_url: imageUrl // Add imagem_url for backwards compatibility
              } : {
                nome: 'Produto não disponível',
                preco_normal: item.preco_unitario,
                imagem_url: null
              } // Provide fallback product info if not found
            };
          });
        }
        
        // Combine order with items
        const orderWithItems = {
          ...orderData,
          items: itemsWithProducts || []
        };
        
        console.log(`📊 [orderService.getOrderById] Order has ${orderWithItems.items?.length || 0} items`);
        return orderWithItems;
      } catch (itemError) {
        console.error("❌ [orderService.getOrderById] Error processing order items:", itemError);
        // Return order without items in case of error
        return {
          ...orderData,
          items: []
        };
      }
    } catch (error: any) {
      console.error("❌ [orderService.getOrderById] Error:", error);
      toast.error("Erro ao carregar detalhes do pedido", {
        description: error.message || "Tente novamente mais tarde"
      });
      return null;
    }
  }
};
