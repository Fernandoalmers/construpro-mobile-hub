
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';
import { calculateCartSummary } from './calculateCartSummary';

// Define a type for the product data returned from Supabase
type ProdutoData = {
  id: string;
  nome: string;
  preco_normal: number;
  preco_promocional?: number;
  imagens?: string | string[]; // Can be JSON string or array
  categoria?: string;
  estoque: number;
  pontos_consumidor?: number;
  vendedor_id?: string;
};

/**
 * Extract and normalize image URLs from different formats
 */
function extractImageUrls(imagensData: any): string[] {
  const urls: string[] = [];
  
  if (!imagensData) {
    return urls;
  }
  
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
          .filter(url => url && typeof url === 'string' && url.trim() !== '' && !url.startsWith('blob:'));
      }
      if (typeof parsed === 'string' && parsed.trim() !== '' && !parsed.startsWith('blob:')) {
        return [parsed];
      }
    } catch (e) {
      // If it's not valid JSON, treat it as a direct URL
      if (imagensData.trim() !== '' && !imagensData.startsWith('blob:')) {
        return [imagensData];
      }
    }
  }
  
  // If it's already an array
  if (Array.isArray(imagensData)) {
    imagensData.forEach((img) => {
      if (typeof img === 'string' && img.trim() !== '' && !img.startsWith('blob:')) {
        urls.push(img);
      } else if (img && typeof img === 'object') {
        const url = img.url || img.path || img.src;
        if (url && typeof url === 'string' && url.trim() !== '' && !url.startsWith('blob:')) {
          urls.push(url);
        }
      }
    });
    return urls;
  }
  
  // If it's an object with url/path/src property
  if (imagensData && typeof imagensData === 'object') {
    const url = imagensData.url || imagensData.path || imagensData.src;
    if (url && typeof url === 'string' && url.trim() !== '' && !url.startsWith('blob:')) {
      return [url];
    }
  }
  
  return urls;
}

/**
 * Process all cart items for a specific cart
 */
export async function processCartItems(cartId: string, userId: string): Promise<Cart> {
  try {
    console.log(`[processCartItems] Processing items for cart: ${cartId}`);
    
    // Get all cart items with related product information
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id, 
        quantity, 
        price_at_add,
        product_id,
        produtos (
          id, 
          nome, 
          preco_normal, 
          preco_promocional, 
          imagens, 
          categoria, 
          estoque, 
          pontos_consumidor,
          vendedor_id
        )
      `)
      .eq('cart_id', cartId);
      
    if (itemsError) {
      console.error('[processCartItems] Error fetching cart items:', itemsError);
      throw itemsError;
    }
    
    // Debug log cart items to help troubleshoot
    console.log('[processCartItems] Retrieved', cartItems?.length || 0, 'items from cart:', 
      cartItems ? cartItems.map(i => ({id: i.id, product_id: i.product_id, has_produto: !!i.produtos})) : 'none');
    
    // Transform the cart items into the expected format
    const transformedItems: CartItem[] = (cartItems || []).map(item => {
      // Create a default product object as fallback
      const defaultProduct: ProdutoData = {
        id: item.product_id || '',
        nome: '',
        preco_normal: 0,
        estoque: 0
      };
      
      // Check if produtos exists and is not an error before using it
      const produtoExists = item.produtos !== null && item.produtos !== undefined;
      const isValidProduct = produtoExists && 
        typeof item.produtos === 'object' && 
        !('error' in (item.produtos as object || {}));
      
      if (!isValidProduct || !item.produtos) {
        console.warn('[processCartItems] Invalid product data for item:', item.id, 'product_id:', item.product_id);
      }
      
      // Use the valid product data or the default
      const produto: ProdutoData = isValidProduct && item.produtos ? 
        (item.produtos as unknown as ProdutoData) : defaultProduct;
      
      // Extract and normalize image URLs
      const imagensArray = extractImageUrls(produto.imagens);
      const firstImageUrl = imagensArray.length > 0 ? imagensArray[0] : null;
      
      if (!firstImageUrl) {
        console.log(`[processCartItems] No images found for product: ${produto.id}`);
      } else {
        console.log(`[processCartItems] Found image for product ${produto.id}:`, firstImageUrl);
      }
      
      // Calculate the price to use (promotional if available, otherwise normal)
      const productPrice = produto.preco_promocional || produto.preco_normal;
      const itemQuantity = item.quantity || 1;
      
      return {
        id: item.id,
        produto_id: item.product_id,
        quantidade: itemQuantity,
        preco: productPrice,
        subtotal: productPrice * itemQuantity,
        produto: {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco_normal,
          preco_promocional: produto.preco_promocional,
          imagem_url: firstImageUrl, // Use the extracted image URL
          imagens: imagensArray, // Store the full array for compatibility
          categoria: produto.categoria,
          estoque: produto.estoque,
          pontos: produto.pontos_consumidor || 0,
          loja_id: produto.vendedor_id // Map vendedor_id to loja_id for compatibility
        }
      };
    });
    
    // Calculate cart summary
    const summary = calculateCartSummary(transformedItems);
    
    console.log(`[processCartItems] Processed ${transformedItems.length} cart items with total: ${summary.subtotal}`);
    
    return {
      id: cartId,
      user_id: userId,
      items: transformedItems,
      summary
    };
  } catch (error) {
    console.error('[processCartItems] Error processing cart items:', error);
    throw error;
  }
}
