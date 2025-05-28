
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
    // Fetch cart items with product data
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        price_at_add,
        created_at,
        updated_at,
        products!cart_items_product_id_fkey (
          id,
          nome,
          preco,
          preco_normal,
          preco_promocional,
          imagem_url,
          pontos,
          pontos_profissional,
          pontos_consumidor,
          estoque,
          categoria,
          segmento,
          loja_id,
          status
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
      produto: item.products ? {
        id: item.products.id,
        nome: item.products.nome,
        preco: item.products.preco,
        preco_normal: item.products.preco_normal,
        preco_promocional: item.products.preco_promocional,
        imagem_url: item.products.imagem_url,
        pontos: item.products.pontos,
        pontos_profissional: item.products.pontos_profissional,
        pontos_consumidor: item.products.pontos_consumidor,
        estoque: item.products.estoque,
        categoria: item.products.categoria,
        segmento: item.products.segmento,
        loja_id: item.products.loja_id,
        status: item.products.status
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
