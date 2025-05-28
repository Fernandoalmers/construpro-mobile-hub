
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';
import { calculateCartSummary } from './calculateCartSummary';

/**
 * Process cart items and calculate summary
 */
export async function processCartItems(
  cartId: string, 
  userId: string,
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
): Promise<Cart> {
  console.log('[processCartItems] Processing cart items for cart:', cartId, 'user type:', userType);
  
  try {
    // Fetch cart items with product data from the correct table (produtos)
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        price_at_add,
        created_at,
        updated_at,
        produtos!cart_items_product_id_fkey (
          id,
          nome,
          preco_normal,
          preco_promocional,
          imagem_url,
          pontos_profissional,
          pontos_consumidor,
          estoque,
          categoria,
          segmento,
          status,
          vendedor_id
        )
      `)
      .eq('cart_id', cartId);

    if (itemsError) {
      console.error('[processCartItems] Error fetching cart items:', itemsError);
      throw itemsError;
    }

    if (!items || items.length === 0) {
      console.log('[processCartItems] No items found in cart');
      return {
        id: cartId,
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

    // Transform the data to match our CartItem interface
    const cartItems: CartItem[] = items.map(item => ({
      id: item.id,
      cart_id: cartId,
      produto_id: item.product_id,
      quantidade: item.quantity,
      preco: item.price_at_add,
      subtotal: item.price_at_add * item.quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
      produto: item.produtos ? {
        id: item.produtos.id,
        nome: item.produtos.nome,
        preco: item.produtos.preco_promocional || item.produtos.preco_normal,
        preco_normal: item.produtos.preco_normal,
        preco_promocional: item.produtos.preco_promocional,
        imagem_url: item.produtos.imagem_url,
        pontos: item.produtos.pontos_consumidor || 0,
        pontos_profissional: item.produtos.pontos_profissional,
        pontos_consumidor: item.produtos.pontos_consumidor,
        estoque: item.produtos.estoque,
        categoria: item.produtos.categoria,
        segmento: item.produtos.segmento,
        loja_id: item.produtos.vendedor_id,
        status: item.produtos.status
      } : null
    }));

    // Calculate summary with user type
    const summary = calculateCartSummary(cartItems, userType);

    const cart: Cart = {
      id: cartId,
      user_id: userId,
      items: cartItems,
      summary
    };

    console.log('[processCartItems] Cart processed successfully:', {
      itemCount: cartItems.length,
      totalPoints: summary.totalPoints,
      userType
    });

    return cart;
  } catch (error) {
    console.error('[processCartItems] Error processing cart items:', error);
    throw error;
  }
}
