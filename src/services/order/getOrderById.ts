
import { supabase } from '@/integrations/supabase/client';
import { OrderData, OrderItem, ProductData } from './types';

// Helper function to extract image URL from product data
export function getProductImageUrl(product: any): string | null {
  if (!product) return null;
  
  // First, check if there's a direct imagem_url field
  if (product.imagem_url && typeof product.imagem_url === 'string') {
    return product.imagem_url;
  }
  
  // Then check the imagens field (which is an array)
  if (product.imagens) {
    // Handle case where imagens is already an array
    if (Array.isArray(product.imagens) && product.imagens.length > 0) {
      const firstImage = product.imagens[0];
      
      // If it's a string URL, return it
      if (typeof firstImage === 'string') {
        return firstImage;
      }
      
      // If it's an object with URL properties
      if (typeof firstImage === 'object' && firstImage !== null) {
        return firstImage.url || firstImage.path || firstImage.src || null;
      }
    }
    
    // Handle case where imagens might be a JSON string
    if (typeof product.imagens === 'string') {
      try {
        const parsed = JSON.parse(product.imagens);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstImage = parsed[0];
          if (typeof firstImage === 'string') {
            return firstImage;
          }
          if (typeof firstImage === 'object' && firstImage !== null) {
            return firstImage.url || firstImage.path || firstImage.src || null;
          }
        }
      } catch (e) {
        console.warn('Failed to parse imagens JSON:', e);
      }
    }
  }
  
  return null;
}

export async function getOrderById(orderId: string): Promise<OrderData | null> {
  try {
    console.log(`🔍 [getOrderById] Fetching order: ${orderId}`);
    
    // Get order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !orderData) {
      console.error('❌ [getOrderById] Error fetching order:', orderError);
      return null;
    }
    
    // Get order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error('❌ [getOrderById] Error fetching order items:', itemsError);
      return { ...orderData, items: [] };
    }
    
    // Get product IDs to fetch product data
    const productIds = itemsData?.map(item => item.produto_id) || [];
    
    let productsData: any[] = [];
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('produtos')
        .select('id, nome, imagens, descricao, preco_normal, categoria')
        .in('id', productIds);
      
      if (productsError) {
        console.error('❌ [getOrderById] Error fetching products:', productsError);
      } else {
        productsData = products || [];
      }
    }
    
    // Create products map
    const productsMap = new Map(productsData.map(product => [product.id, product]));
    
    // Build order items with product data
    const orderItems: OrderItem[] = (itemsData || []).map(item => {
      const productData = productsMap.get(item.produto_id);
      
      const produto: ProductData = {
        id: item.produto_id,
        nome: productData?.nome || 'Produto indisponível',
        imagens: productData?.imagens || [],
        imagem_url: getProductImageUrl(productData),
        descricao: productData?.descricao || '',
        preco_normal: productData?.preco_normal || item.preco_unitario,
        categoria: productData?.categoria || ''
      };
      
      return {
        id: item.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        produto
      };
    });
    
    console.log(`✅ [getOrderById] Successfully fetched order with ${orderItems.length} items`);
    
    return {
      ...orderData,
      items: orderItems
    };
    
  } catch (error) {
    console.error('❌ [getOrderById] Unexpected error:', error);
    return null;
  }
}

// Direct method for better reliability
export async function getOrderByIdDirect(orderId: string): Promise<OrderData | null> {
  try {
    console.log(`🔍 [getOrderByIdDirect] Fetching order directly: ${orderId}`);
    
    const result = await supabase.rpc('get_order_by_id', { order_id: orderId });
    
    if (result.error || !result.data) {
      console.error('❌ [getOrderByIdDirect] RPC error:', result.error);
      return getOrderById(orderId); // Fallback to regular method
    }
    
    const orderData = result.data;
    
    // Process items if they exist
    if (orderData.items && Array.isArray(orderData.items)) {
      // Get product details for items
      const productIds = orderData.items.map((item: any) => item.produto_id);
      
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('produtos')
          .select('id, nome, imagens, descricao, preco_normal, categoria')
          .in('id', productIds);
        
        const productsMap = new Map((productsData || []).map(p => [p.id, p]));
        
        orderData.items = orderData.items.map((item: any) => {
          const productData = productsMap.get(item.produto_id);
          
          return {
            ...item,
            produto: {
              id: item.produto_id,
              nome: productData?.nome || 'Produto indisponível',
              imagens: productData?.imagens || [],
              imagem_url: getProductImageUrl(productData),
              descricao: productData?.descricao || '',
              preco_normal: productData?.preco_normal || item.preco_unitario,
              categoria: productData?.categoria || ''
            }
          };
        });
      }
    }
    
    return orderData;
    
  } catch (error) {
    console.error('❌ [getOrderByIdDirect] Error:', error);
    return getOrderById(orderId); // Fallback
  }
}
