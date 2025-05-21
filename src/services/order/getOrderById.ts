
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { OrderData, OrderItem } from './types';

export async function getOrderById(orderId: string): Promise<OrderData | null> {
  try {
    console.log("🔍 [orderService.getOrderById] Fetching order with ID:", orderId);
    
    // First try using the database function
    const { data: orderData, error } = await supabase
      .rpc('get_order_by_id', { order_id: orderId });
    
    if (error) {
      console.error("❌ [orderService.getOrderById] Error fetching order using RPC:", error);
      // Fall back to regular query method
      return getOrderByIdDirect(orderId);
    }
    
    if (!orderData) {
      console.error("⚠️ [orderService.getOrderById] No order found with ID:", orderId);
      return null;
    }
    
    // Ensure orderData is properly typed
    const typedOrderData = typeof orderData === 'object' ? orderData as OrderData : null;
    
    if (!typedOrderData) {
      console.error("⚠️ [orderService.getOrderById] Invalid order data format:", orderData);
      return null;
    }
    
    // Process items if they exist in the RPC response
    if (typedOrderData.items && Array.isArray(typedOrderData.items)) {
      processOrderItems(typedOrderData);
    }
    
    console.log("✅ [orderService.getOrderById] Successfully retrieved order data:", typedOrderData);
    return typedOrderData;
  } catch (error: any) {
    console.error("❌ [orderService.getOrderById] Error:", error);
    toast.error("Erro ao carregar detalhes do pedido", {
      description: error.message || "Tente novamente mais tarde"
    });
    return null;
  }
}

// Helper function to standardize product image access across the application
export function getProductImageUrl(produto: any): string | null {
  if (!produto) return null;
  
  // Direct image_url property
  if (produto.imagem_url) return produto.imagem_url;
  
  // Check images array with various formats
  if (produto.imagens) {
    if (Array.isArray(produto.imagens) && produto.imagens.length > 0) {
      const firstImage = produto.imagens[0];
      
      // If image is a string URL
      if (typeof firstImage === 'string') {
        return firstImage;
      }
      
      // If image is an object with URL property
      if (typeof firstImage === 'object' && firstImage !== null) {
        return firstImage.url || firstImage.path || firstImage.src || null;
      }
    }
  }
  
  return null;
}

// Helper function to process order items and standardize product data
function processOrderItems(orderData: OrderData): void {
  if (!orderData.items || !Array.isArray(orderData.items)) {
    orderData.items = []; // Ensure items is always an array
    return;
  }
  
  console.log(`Processing ${orderData.items.length} order items`);
  
  orderData.items = orderData.items.map(item => {
    // Create default product as fallback
    const defaultProduct = {
      id: item.produto_id,
      nome: 'Produto indisponível',
      imagens: [] as any[],
      descricao: '',
      preco_normal: item.preco_unitario,
      categoria: '',
      preco_promocional: undefined
    };
    
    // Check if product data exists
    const produtoExists = item.produto !== null && item.produto !== undefined;
    
    // Safe type check before accessing properties
    if (!produtoExists) {
      item.produto = defaultProduct;
      return item;
    }
    
    // Safe access to produto object
    if (typeof item.produto === 'object') {
      // Check if it's an error object
      const itemProduto = item.produto as Record<string, any>;
      const hasError = 'error' in itemProduto;
      
      if (hasError) {
        item.produto = defaultProduct;
        return item;
      }
      
      // Ensure essential properties exist
      if (!itemProduto.id || !itemProduto.nome) {
        item.produto = defaultProduct;
        return item;
      }
      
      // Add image URL helper for consistent access
      if (!itemProduto.imagem_url) {
        itemProduto.imagem_url = getProductImageUrl(itemProduto);
      }
    } else {
      // Not an object, use default
      item.produto = defaultProduct;
    }
    
    return item;
  });
  
  console.log(`Processed items: ${orderData.items.length} items available`);
}

// Direct method as fallback - uses explicit queries rather than RPC
export async function getOrderByIdDirect(orderId: string): Promise<OrderData | null> {
  try {
    console.log("🔄 [orderService.getOrderByIdDirect] Fetching order directly with ID:", orderId);
    
    // First fetch the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      console.error("❌ [orderService.getOrderByIdDirect] Error fetching order:", orderError);
      throw orderError;
    }
    
    if (!orderData) {
      console.error("⚠️ [orderService.getOrderByIdDirect] No order found with ID:", orderId);
      return null;
    }
    
    // Then fetch the order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        produto:produto_id (
          id,
          nome,
          imagens,
          descricao,
          preco_normal,
          preco_promocional,
          categoria
        )
      `)
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error("❌ [orderService.getOrderByIdDirect] Error fetching order items:", itemsError);
      // Continue with the order data even if items failed
    }
    
    // Process items to ensure type safety with produtos
    const processedItems: OrderItem[] = [];
    
    if (itemsData && Array.isArray(itemsData)) {
      console.log(`Found ${itemsData.length} items for order ${orderId}`);
      
      itemsData.forEach(item => {
        // Create the default product structure for when there's an error
        const defaultProduct = {
          id: item.produto_id,
          nome: 'Produto indisponível',
          imagens: [] as any[],
          descricao: '',
          preco_normal: item.preco_unitario,
          categoria: '',
          preco_promocional: undefined
        };
        
        // Process product data with careful type checking
        let productData: OrderItem['produto'] = defaultProduct;
        
        if (item.produto !== null && typeof item.produto === 'object') {
          // Safe type casting
          const safeProduto = item.produto as Record<string, any>;
          
          // Verify if essential product properties exist
          if ('id' in safeProduto && 'nome' in safeProduto) {
            productData = safeProduto as OrderItem['produto'];
            
            // Add consistent image URL access
            if (!productData.imagem_url) {
              productData.imagem_url = getProductImageUrl(productData);
            }
          }
        }
        
        const orderItem: OrderItem = {
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          produto: productData
        };
        
        processedItems.push(orderItem);
      });
    } else {
      console.warn("⚠️ [orderService.getOrderByIdDirect] No items found for order:", orderId);
    }
    
    // Combine order with processed items
    const fullOrder: OrderData = {
      ...orderData,
      items: processedItems
    };
    
    console.log("✅ [orderService.getOrderByIdDirect] Successfully retrieved full order data:", {
      orderId: fullOrder.id,
      itemCount: processedItems.length
    });
    
    return fullOrder;
  } catch (error: any) {
    console.error("❌ [orderService.getOrderByIdDirect] Error:", error);
    toast.error("Erro ao carregar detalhes do pedido", {
      description: error.message || "Tente novamente mais tarde"
    });
    return null;
  }
}
