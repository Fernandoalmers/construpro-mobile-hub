
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';
import { calculateCartSummary } from './calculateCartSummary';

// Define a type for the product data returned from Supabase
type ProdutoData = {
  id: string;
  nome: string;
  preco_normal: number;
  preco_promocional?: number;
  imagens?: string[]; // Array of image URLs
  categoria?: string;
  estoque: number;
  pontos_consumidor?: number; // Changed from pontos to pontos_consumidor to match DB
  loja_id?: string;
};

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
          loja_id
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
      // First check if item.produtos is not null or undefined
      const produtoExists = item.produtos !== null && item.produtos !== undefined;
      
      // Then check if it's a valid object (not an error)
      const isValidProduct = produtoExists && 
        typeof item.produtos === 'object' && 
        !('error' in (item.produtos as object || {}));
      
      if (!isValidProduct || !item.produtos) {
        console.warn('[processCartItems] Invalid product data for item:', item.id, 'product_id:', item.product_id);
      }
      
      // Use the valid product data or the default
      // Cast to unknown first then to ProdutoData to avoid TypeScript error
      const produto: ProdutoData = isValidProduct && item.produtos ? 
        (item.produtos as unknown as ProdutoData) : defaultProduct;
      
      // Extract the first image URL from the imagens array if available
      let imagemUrl = '';
      if (produto.imagens && Array.isArray(produto.imagens) && produto.imagens.length > 0) {
        imagemUrl = produto.imagens[0];
        console.log('[processCartItems] Found image for product:', produto.id, 'URL:', imagemUrl);
      } else {
        console.log('[processCartItems] No images found for product:', produto.id);
      }
      
      const preco = item.price_at_add || produto.preco_promocional || produto.preco_normal || 0;
      const subtotal = item.quantity * preco;
      
      // Get points from pontos_consumidor, not pontos
      const pontos = produto.pontos_consumidor || 0;
      
      return {
        id: item.id,
        produto_id: item.product_id,
        quantidade: item.quantity,
        preco: preco,
        subtotal: subtotal,
        produto: {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco_normal,
          preco_promocional: produto.preco_promocional,
          imagem_url: imagemUrl, // Use the first image from the array
          categoria: produto.categoria || '',
          estoque: produto.estoque,
          pontos: pontos,
          loja_id: produto.loja_id || ''
        }
      };
    });
    
    // Calculate cart totals
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
    // Return empty cart on error
    return {
      id: cartId || '',
      user_id: userId,
      items: [],
      summary: {
        subtotal: 0,
        shipping: 0,
        totalItems: 0,
        totalPoints: 0
      }
    };
  }
}
