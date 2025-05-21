
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
    } else {
      console.log("⚠️ [orderService.getOrderById] No items in RPC response, fetching directly");
      // If no items in RPC response, try to fetch items directly
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal,
          created_at
        `)
        .eq('order_id', orderId);
        
      if (itemsError) {
        console.error("❌ [orderService.getOrderById] Error fetching order items:", itemsError);
      } else if (itemsData && itemsData.length > 0) {
        console.log(`✅ [orderService.getOrderById] Fetched ${itemsData.length} items directly`);
        typedOrderData.items = await processItemsWithProductData(itemsData, orderId);
      } else {
        console.warn("⚠️ [orderService.getOrderById] No items found for order");
        typedOrderData.items = [];
      }
    }
    
    console.log("✅ [orderService.getOrderById] Successfully retrieved order data:", {
      orderId: typedOrderData.id,
      itemsCount: typedOrderData.items?.length || 0,
      hasItems: !!typedOrderData.items && Array.isArray(typedOrderData.items)
    });
    
    return typedOrderData;
  } catch (error: any) {
    console.error("❌ [orderService.getOrderById] Error:", error);
    toast.error("Erro ao carregar detalhes do pedido", {
      description: error.message || "Tente novamente mais tarde"
    });
    return null;
  }
}

// Improved helper function to standardize product image access across the application
export function getProductImageUrl(produto: any): string | null {
  if (!produto) return null;
  
  // Debug log the product image data structure
  console.log("[getProductImageUrl] Product image data:", {
    hasDirectImageUrl: !!produto.imagem_url,
    hasImagens: !!produto.imagens,
    imagensType: produto.imagens ? typeof produto.imagens : 'none',
    imagesLength: produto.imagens && Array.isArray(produto.imagens) ? produto.imagens.length : 0,
    firstImageType: produto.imagens && Array.isArray(produto.imagens) && produto.imagens.length > 0 ? 
      typeof produto.imagens[0] : 'none'
  });
  
  // Direct image_url property
  if (produto.imagem_url) return produto.imagem_url;
  
  // Check images array with various formats
  if (produto.imagens) {
    // Handle case where imagens might be a string (URL) directly
    if (typeof produto.imagens === 'string') {
      return produto.imagens;
    }
    
    // Check if it's a valid array with content
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

// New helper function to process items with product data
async function processItemsWithProductData(items: any[], orderId: string): Promise<OrderItem[]> {
  console.log(`[processItemsWithProductData] Processing ${items.length} items for order ${orderId}`);
  
  // Create a list of product IDs to fetch
  const productIds = items.map(item => item.produto_id).filter(Boolean);
  
  if (!productIds.length) {
    console.warn("[processItemsWithProductData] No valid product IDs to fetch");
    return items as OrderItem[];
  }
  
  // Fetch products for all items in a single query
  const { data: products, error } = await supabase
    .from('produtos')
    .select('id, nome, imagens, descricao, preco_normal, preco_promocional, categoria')
    .in('id', productIds);
  
  if (error) {
    console.error("[processItemsWithProductData] Error fetching products:", error);
    return items.map(item => ({
      ...item,
      produto: {
        id: item.produto_id,
        nome: 'Produto indisponível',
        imagens: [],
        descricao: '',
        preco_normal: item.preco_unitario,
        categoria: ''
      }
    }));
  }
  
  console.log(`[processItemsWithProductData] Fetched ${products.length} products for ${items.length} items`);
  
  // Create a map of products by ID for easy lookup
  const productsMap: Record<string, any> = {};
  products.forEach(product => {
    productsMap[product.id] = product;
    // We're not setting imagem_url here as it doesn't exist in the produtos table
    // We'll use getProductImageUrl when we need the image
  });
  
  // Map the items with their products
  return items.map(item => {
    const productData = productsMap[item.produto_id] || {
      id: item.produto_id,
      nome: 'Produto indisponível',
      imagens: [],
      descricao: '',
      preco_normal: item.preco_unitario,
      categoria: ''
    };
    
    // Add standardized image URL 
    if (productData) {
      productData.imagem_url = getProductImageUrl(productData);
    }
    
    return {
      ...item,
      produto: productData
    };
  });
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
    if (!item.produto) {
      item.produto = defaultProduct;
      return item;
    }
    
    // Safe type check before accessing properties
    if (typeof item.produto === 'object' && item.produto !== null) {
      // Check if it has the expected shape (not an error object)
      if ('id' in item.produto && 'nome' in item.produto) {
        // It's a valid product, add the standardized image URL
        if (!item.produto.imagem_url) {
          item.produto.imagem_url = getProductImageUrl(item.produto);
        }
      } else {
        // It's either an error object or malformed data, use default
        console.warn(`[processOrderItems] Invalid product data for produto_id ${item.produto_id}:`, item.produto);
        item.produto = defaultProduct;
      }
    } else {
      // Not an object, use default
      item.produto = defaultProduct;
    }
    
    return item;
  });
  
  console.log(`Processed items: ${orderData.items.length} items available`);
  
  // Debug log first item to verify image processing
  if (orderData.items.length > 0) {
    const firstItem = orderData.items[0];
    console.log("First item product data:", {
      id: firstItem.produto_id,
      nome: firstItem.produto?.nome,
      hasImage: !!firstItem.produto?.imagem_url,
      imageUrl: firstItem.produto?.imagem_url?.substring(0, 50),
      hasImagens: !!firstItem.produto?.imagens && 
                Array.isArray(firstItem.produto?.imagens) && 
                firstItem.produto?.imagens.length > 0
    });
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
    
    // IMPROVED: Then fetch the order items with explicit JOIN instead of foreign table syntax
    console.log("🔍 [orderService.getOrderByIdDirect] Fetching order items with explicit JOIN");
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        created_at
      `)
      .eq('order_id', orderId);
    
    if (itemsError) {
      console.error("❌ [orderService.getOrderByIdDirect] Error fetching order items:", itemsError);
      // Continue with the order data even if items failed
    }
    
    // Process items to ensure type safety with produtos
    let processedItems: OrderItem[] = [];
    
    if (itemsData && Array.isArray(itemsData) && itemsData.length > 0) {
      console.log(`Found ${itemsData.length} items for order ${orderId}, fetching product details`);
      
      // Get all product IDs
      const productIds = itemsData
        .map(item => item.produto_id)
        .filter(id => id !== null && id !== undefined);
      
      // Fetch all products in a single query
      let productsData: any[] = [];
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('produtos')
          .select('id, nome, imagens, descricao, preco_normal, preco_promocional, categoria')
          .in('id', productIds);
          
        if (productsError) {
          console.error("❌ [orderService.getOrderByIdDirect] Error fetching products:", productsError);
        } else {
          console.log(`Fetched ${products?.length || 0} products for order items`);
          productsData = products || [];
        }
      }
      
      // Create a map of products by ID
      const productsMap: Record<string, any> = {};
      productsData.forEach(product => {
        productsMap[product.id] = {
          ...product,
          imagem_url: getProductImageUrl(product)
        };
      });
      
      // Process each item
      processedItems = itemsData.map(item => {
        // Get product data from map or use default
        const productData = productsMap[item.produto_id] || {
          id: item.produto_id,
          nome: 'Produto indisponível',
          imagens: [] as any[],
          descricao: '',
          preco_normal: item.preco_unitario,
          categoria: '',
          preco_promocional: undefined
        };
        
        console.log(`Processing item ${item.id} for product ${item.produto_id}:`, {
          hasProductData: !!productsMap[item.produto_id],
          hasImages: productData.imagens && Array.isArray(productData.imagens) && productData.imagens.length > 0,
          hasImageUrl: !!productData.imagem_url
        });
        
        return {
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          produto: productData
        };
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
      itemCount: processedItems.length,
      firstItem: processedItems.length > 0 ? {
        id: processedItems[0].id,
        productName: processedItems[0].produto?.nome,
        hasImage: !!processedItems[0].produto?.imagem_url
      } : 'No items'
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
