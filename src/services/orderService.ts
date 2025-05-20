
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
      
      // Get order data directly using service role to bypass RLS issues
      const { data: orderData, error: orderError } = await supabaseService.invokeFunction('order-processing', {
        method: 'GET',
        body: { orderId },
        maxRetries: 2
      });
      
      if (orderError) {
        console.error("❌ [orderService.getOrderById] Error fetching order via edge function:", orderError);
        
        // Fallback to direct method with regular client if edge function fails
        return await this.getOrderByIdDirect(orderId);
      }
      
      if (!orderData || !orderData.order) {
        console.error(`⚠️ [orderService.getOrderById] No order data returned for ID ${orderId}`);
        throw new Error('Pedido não encontrado');
      }
      
      console.log(`✅ [orderService.getOrderById] Successfully retrieved order ${orderId} via edge function`);
      return orderData.order;
      
    } catch (error: any) {
      console.error("❌ [orderService.getOrderById] Error:", error);
      
      // Try fallback method if main method fails
      try {
        return await this.getOrderByIdDirect(orderId);
      } catch (fallbackError) {
        console.error("❌ [orderService.getOrderByIdDirect] Fallback also failed:", fallbackError);
        toast.error("Erro ao carregar detalhes do pedido", {
          description: error.message || "Tente novamente mais tarde"
        });
        return null;
      }
    }
  },
  
  // Direct method as fallback that tries to avoid the RLS issue
  async getOrderByIdDirect(orderId: string): Promise<any> {
    try {
      console.log(`🔍 [orderService.getOrderByIdDirect] Fetching order details directly for ID: ${orderId}`);
      
      // Use the database function we created to bypass RLS issues
      const { data, error } = await supabase.rpc('get_order_by_id', { order_id: orderId });
      
      if (error) {
        console.error("❌ [orderService.getOrderByIdDirect] Error using get_order_by_id function:", error);
        throw error;
      }
      
      if (!data) {
        console.error(`⚠️ [orderService.getOrderByIdDirect] No order found with ID ${orderId}`);
        throw new Error('Pedido não encontrado');
      }
      
      console.log(`📊 [orderService.getOrderByIdDirect] Order retrieved successfully:`, data);
      
      // Safely process the order data from JSON response
      const orderData: Record<string, any> = data;
      
      // Handle items property safely
      if (typeof orderData.items !== 'undefined') {
        let itemsArray: any[] = [];
        
        // Parse items if it's a string representation of JSON
        if (typeof orderData.items === 'string') {
          try {
            itemsArray = JSON.parse(orderData.items);
            orderData.items = itemsArray;
          } catch (e) {
            console.warn("Unable to parse items string:", e);
            orderData.items = [];
          }
        } else if (Array.isArray(orderData.items)) {
          // If already an array, use directly
          itemsArray = orderData.items;
        } else if (orderData.items && typeof orderData.items === 'object') {
          // If it's a JSONB object but not an array
          console.warn("Items is an object but not an array, converting to array");
          itemsArray = [orderData.items];
        } else {
          // Default to empty array
          itemsArray = [];
          orderData.items = itemsArray;
        }
        
        // Process items to ensure they have product details
        if (itemsArray && itemsArray.length > 0) {
          // Get all product IDs
          const productIds = itemsArray.map((item: any) => item.produto_id);
          
          // Fetch products in a single query
          const { data: productsData, error: productsError } = await supabase
            .from('produtos')
            .select('id, nome, imagens, preco_normal, preco_promocional, descricao, categoria')
            .in('id', productIds);
            
          if (productsError) {
            console.error("❌ [orderService.getOrderByIdDirect] Error fetching products:", productsError);
          }
          
          // Create a map of product ID to product data for quick lookup
          const productsMap: {[key: string]: any} = {};
          if (productsData) {
            productsData.forEach(product => {
              productsMap[product.id] = product;
            });
          }
          
          // Combine item data with product data
          orderData.items = itemsArray.map((item: any) => {
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
              }
            };
          });
        }
      } else {
        // Ensure items is always an array to prevent undefined errors
        orderData.items = [];
      }
      
      return orderData;
    } catch (error: any) {
      console.error("❌ [orderService.getOrderByIdDirect] Error:", error);
      throw error;
    }
  }
};
