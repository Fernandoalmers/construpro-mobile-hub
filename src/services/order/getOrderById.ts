
import { supabase } from '@/integrations/supabase/client';
import { supabaseService } from '../supabaseService';
import { OrderData, OrderItem, ProductData } from './types';
import { toast } from '@/components/ui/sonner';

export async function getOrderById(orderId: string): Promise<OrderData | null> {
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
      return await getOrderByIdDirect(orderId);
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
      return await getOrderByIdDirect(orderId);
    } catch (fallbackError) {
      console.error("❌ [orderService.getOrderByIdDirect] Fallback also failed:", fallbackError);
      toast.error("Erro ao carregar detalhes do pedido", {
        description: error.message || "Tente novamente mais tarde"
      });
      return null;
    }
  }
}

// Direct method as fallback that tries to avoid the RLS issue
export async function getOrderByIdDirect(orderId: string): Promise<OrderData> {
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
    // Fix: Check if data is an object before treating it as one
    const orderData: Record<string, any> = typeof data === 'object' && data !== null 
      ? data 
      : { error: "Formato de dados inválido" };
    
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
        await enrichOrderItemsWithProductData(orderData, itemsArray);
      }
    } else {
      // Ensure items is always an array to prevent undefined errors
      orderData.items = [];
    }
    
    return orderData as OrderData;
  } catch (error: any) {
    console.error("❌ [orderService.getOrderByIdDirect] Error:", error);
    throw error;
  }
}

// Helper function to enrich order items with product data
async function enrichOrderItemsWithProductData(orderData: Record<string, any>, itemsArray: any[]): Promise<void> {
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
  const productsMap: Record<string, any> = {};
  if (productsData) {
    productsData.forEach(product => {
      // Ensure product data is compatible with ProductData type
      productsMap[product.id] = {
        ...product,
        // Ensure imagens is treated as any[] for type compatibility
        imagens: product.imagens || []
      };
    });
  }
  
  // Combine item data with product data
  orderData.items = itemsArray.map((item: any) => {
    const productData = productsMap[item.produto_id] || null;
    
    // Extract image URL from product data if available
    let imageUrl = null;
    if (productData && productData.imagens) {
      const imagens = productData.imagens;
      if (Array.isArray(imagens) && imagens.length > 0) {
        const firstImage = imagens[0];
        if (typeof firstImage === 'string') {
          imageUrl = firstImage;
        } else if (firstImage && typeof firstImage === 'object') {
          imageUrl = firstImage.url || firstImage.path || null;
        }
      } else if (typeof imagens === 'string') {
        // Handle case where imagens might be a JSON string
        try {
          const parsedImages = JSON.parse(imagens);
          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
            const firstImage = parsedImages[0];
            if (typeof firstImage === 'string') {
              imageUrl = firstImage;
            } else if (firstImage && typeof firstImage === 'object') {
              imageUrl = firstImage.url || firstImage.path || null;
            }
          }
        } catch (e) {
          console.warn("Unable to parse imagens string:", e);
        }
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
    } as OrderItem;
  });
}
