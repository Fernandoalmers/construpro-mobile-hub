
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
    
    console.log("✅ [orderService.getOrderById] Successfully retrieved order data");
    return typedOrderData;
  } catch (error: any) {
    console.error("❌ [orderService.getOrderById] Error:", error);
    toast.error("Erro ao carregar detalhes do pedido", {
      description: error.message || "Tente novamente mais tarde"
    });
    return null;
  }
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
      itemsData.forEach(item => {
        // First check if produto exists at all
        const isProductMissing = !item.produto;
        
        // If produto exists, check if it has error property (SelectQueryError)
        const isProductError = !isProductMissing && 
          typeof item.produto === 'object' && 
          item.produto !== null && 
          'error' in item.produto;
        
        // Either product is missing or has an error
        const hasError = isProductMissing || isProductError;
        
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
        
        const orderItem: OrderItem = {
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          // Use default product for errors, otherwise cast to required type with a proper type assertion
          // First cast to unknown then to the target type to avoid type compatibility errors
          produto: hasError ? defaultProduct : (
            // Make sure we're dealing with a valid product object before casting
            typeof item.produto === 'object' && item.produto !== null && !('error' in item.produto)
              ? (item.produto as unknown as OrderItem['produto'])
              : defaultProduct
          )
        };
        
        processedItems.push(orderItem);
      });
    }
    
    // Combine order with processed items
    const fullOrder: OrderData = {
      ...orderData,
      items: processedItems
    };
    
    console.log("✅ [orderService.getOrderByIdDirect] Successfully retrieved full order data");
    return fullOrder;
  } catch (error: any) {
    console.error("❌ [orderService.getOrderByIdDirect] Error:", error);
    toast.error("Erro ao carregar detalhes do pedido", {
      description: error.message || "Tente novamente mais tarde"
    });
    return null;
  }
}
