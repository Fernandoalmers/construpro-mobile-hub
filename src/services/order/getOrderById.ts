
import { supabase } from '@/integrations/supabase/client';
import { OrderData, OrderItem, ProductData } from './types';

// Helper function to extract and validate image URLs
const extractImageUrls = (imagensData: any): string[] => {
  if (!imagensData) return [];
  
  // If it's a string, try to parse it as JSON
  if (typeof imagensData === 'string') {
    try {
      const parsed = JSON.parse(imagensData);
      if (Array.isArray(parsed)) {
        return parsed
          .map(img => {
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object') return img.url || img.path || img.src || '';
            return '';
          })
          .filter(url => url && typeof url === 'string' && url.trim() !== '');
      }
      if (typeof parsed === 'string' && parsed.trim() !== '') {
        return [parsed];
      }
    } catch (e) {
      // If it's not valid JSON, treat it as a direct URL
      if (imagensData.trim() !== '') {
        return [imagensData];
      }
    }
  }
  
  // If it's already an array
  if (Array.isArray(imagensData)) {
    return imagensData
      .map(img => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object') return img.url || img.path || img.src || '';
        return '';
      })
      .filter(url => url && typeof url === 'string' && url.trim() !== '');
  }
  
  // If it's an object with url/path/src property
  if (imagensData && typeof imagensData === 'object') {
    const url = imagensData.url || imagensData.path || imagensData.src;
    if (url && typeof url === 'string' && url.trim() !== '') {
      return [url];
    }
  }
  
  return [];
};

// Helper function to extract image URL from product data
export function getProductImageUrl(product: any): string | null {
  if (!product) return null;
  
  console.log(`[getProductImageUrl] Processing product:`, {
    hasImageUrl: !!product.imagem_url,
    hasImagens: !!product.imagens,
    imagensType: typeof product.imagens,
    imagensValue: product.imagens
  });
  
  // First, check if there's a direct imagem_url field
  if (product.imagem_url && typeof product.imagem_url === 'string') {
    console.log(`[getProductImageUrl] Using direct imagem_url:`, product.imagem_url);
    return product.imagem_url;
  }
  
  // FIXED: Use the new extractImageUrls helper function
  const extractedUrls = extractImageUrls(product.imagens);
  if (extractedUrls.length > 0) {
    const imageUrl = extractedUrls[0];
    
    // Log blob URL detection
    if (imageUrl.startsWith('blob:')) {
      console.warn(`[getProductImageUrl] Blob URL detected: ${imageUrl.substring(0, 50)}... (this may not work)`);
    }
    
    console.log(`[getProductImageUrl] Using extracted URL:`, imageUrl);
    return imageUrl;
  }
  
  console.log(`[getProductImageUrl] No valid image URL found for product`);
  return null;
}

export async function getOrderById(orderId: string): Promise<OrderData | null> {
  try {
    console.log(`🔍 [getOrderById] Fetching order: ${orderId}`);
    
    // Get order data - incluindo os novos campos de desconto
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, desconto_aplicado, cupom_codigo')
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
      
      // FIXED: Use extractImageUrls for consistent image processing
      const imagens = extractImageUrls(productData?.imagens);
      const imageUrl = imagens.length > 0 ? imagens[0] : null;
      
      // Log blob URL detection
      if (imageUrl && imageUrl.startsWith('blob:')) {
        console.warn(`[getOrderById] Blob URL detected for product ${item.produto_id}: ${imageUrl.substring(0, 50)}...`);
      }
      
      const produto: ProductData = {
        id: item.produto_id,
        nome: productData?.nome || 'Produto indisponível',
        imagens: imagens,
        imagem_url: imageUrl,
        descricao: productData?.descricao || '',
        preco_normal: productData?.preco_normal || item.preco_unitario,
        categoria: productData?.categoria || ''
      };
      
      console.log(`[getOrderById] Processed product ${item.produto_id}:`, {
        hasImageUrl: !!produto.imagem_url,
        imageUrl: produto.imagem_url,
        imagensCount: produto.imagens.length
      });
      
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
    
    // Type guard to ensure we have the right data structure
    const rawOrderData = result.data;
    
    // Validate that the returned data is an object with the expected structure
    if (typeof rawOrderData !== 'object' || rawOrderData === null) {
      console.error('❌ [getOrderByIdDirect] Invalid data type returned:', typeof rawOrderData);
      return getOrderById(orderId); // Fallback to regular method
    }
    
    // Type assertion with runtime validation
    const orderData = rawOrderData as any;
    
    // Ensure we have a valid order structure
    if (!orderData.id) {
      console.error('❌ [getOrderByIdDirect] Missing order ID in response');
      return getOrderById(orderId); // Fallback to regular method
    }
    
    // Process items if they exist and are in the correct format
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
          
          // FIXED: Use extractImageUrls for consistent image processing
          const imagens = extractImageUrls(productData?.imagens);
          const imageUrl = imagens.length > 0 ? imagens[0] : null;
          
          // Log blob URL detection
          if (imageUrl && imageUrl.startsWith('blob:')) {
            console.warn(`[getOrderByIdDirect] Blob URL detected for product ${item.produto_id}: ${imageUrl.substring(0, 50)}...`);
          }
          
          return {
            ...item,
            produto: {
              id: item.produto_id,
              nome: productData?.nome || 'Produto indisponível',
              imagens: imagens,
              imagem_url: imageUrl,
              descricao: productData?.descricao || '',
              preco_normal: productData?.preco_normal || item.preco_unitario,
              categoria: productData?.categoria || ''
            }
          };
        });
      }
    } else {
      // If items don't exist or aren't an array, set empty array
      orderData.items = [];
    }
    
    console.log(`✅ [getOrderByIdDirect] Successfully processed order with ${orderData.items.length} items`);
    return orderData as OrderData;
    
  } catch (error) {
    console.error('❌ [getOrderByIdDirect] Error:', error);
    return getOrderById(orderId); // Fallback
  }
}
