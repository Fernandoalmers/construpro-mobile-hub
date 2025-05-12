
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';
import { calculateCartSummary } from './calculateCartSummary';

// Define a type for the product data returned from Supabase
type ProdutoData = {
  id: string;
  nome: string;
  preco_normal: number;
  preco_promocional?: number;
  imagem_url?: string;
  categoria?: string;
  estoque: number;
  pontos?: number;
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
          imagem_url, 
          categoria, 
          estoque, 
          pontos,
          loja_id
        )
      `)
      .eq('cart_id', cartId);
      
    if (itemsError) {
      console.error('[processCartItems] Error fetching cart items:', itemsError);
      throw itemsError;
    }
    
    // Transform the cart items into the expected format
    const transformedItems: CartItem[] = (cartItems || []).map(item => {
      // Ensure produto is properly typed or default to an empty object with the correct shape
      const produto: ProdutoData = item.produtos as ProdutoData || {
        id: '',
        nome: '',
        preco_normal: 0,
        estoque: 0
      };
      
      const preco = item.price_at_add || produto.preco_promocional || produto.preco_normal || 0;
      const subtotal = item.quantity * preco;
      
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
          imagem_url: produto.imagem_url || '',
          categoria: produto.categoria || '',
          estoque: produto.estoque,
          pontos: produto.pontos || 0,
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
