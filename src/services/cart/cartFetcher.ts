
import { supabase } from '@/integrations/supabase/client';
import { Cart } from '@/types/cart';
import { ensureSingleActiveCart } from './cartConsolidation';

/**
 * Get the active cart for the current user
 */
export const getCart = async (): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.log('[getCart] User not authenticated');
      return null;
    }
    
    const userId = userData.user.id;
    console.log('[getCart] Fetching cart for user:', userId);

    // Ensure there is only one active cart for this user
    const activeCartId = await ensureSingleActiveCart(userId);
    
    if (!activeCartId) {
      console.log('[getCart] No active cart found or could not be created');
      return {
        id: '',
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

    // Fetch cart using the guaranteed single active cart ID
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, user_id')
      .eq('id', activeCartId)
      .single();

    if (cartError) {
      console.error('[getCart] Error fetching cart:', cartError);
      throw cartError;
    }

    // Fetch the items for this cart
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantidade: quantity,
        preco: price_at_add,
        produto_id: product_id,
        produto:produtos(
          id,
          nome,
          preco:preco_normal,
          preco_promocional,
          imagens,
          estoque,
          loja_id:vendedor_id,
          pontos:pontos_consumidor
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('[getCart] Error fetching cart items:', itemsError);
      throw itemsError;
    }

    // Process items and calculate summary for the cart
    let subtotal = 0;
    let totalItems = 0;
    let totalPoints = 0;

    const processedItems = items?.map(item => {
      if (!item.produto || item.produto.error) {
        console.warn('[getCart] Invalid product data for cart item:', item.id);
        return {
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade || 0,
          preco: item.preco || 0,
          subtotal: 0,
          produto: {
            id: item.produto_id,
            nome: 'Produto indisponível',
            preco: item.preco || 0,
            imagem_url: '',
            estoque: 0,
            loja_id: '',
            pontos: 0
          }
        };
      }
      
      const preco = item.produto.preco_promocional || item.produto.preco || item.preco;
      const quantidade = item.quantidade || 0;
      const itemSubtotal = preco * quantidade;
      const pontos = (item.produto.pontos || 0) * quantidade;
      
      subtotal += itemSubtotal;
      totalItems += quantidade;
      totalPoints += pontos;
      
      // Extract image URL from imagens array if available
      let imageUrl = '';
      if (item.produto.imagens && Array.isArray(item.produto.imagens) && item.produto.imagens.length > 0) {
        imageUrl = item.produto.imagens[0];
      }
      
      return {
        id: item.id,
        produto_id: item.produto_id,
        quantidade: quantidade,
        preco: preco,
        subtotal: itemSubtotal,
        produto: {
          id: item.produto.id,
          nome: item.produto.nome || 'Produto sem nome',
          preco,
          imagem_url: imageUrl,
          estoque: item.produto.estoque || 0,
          loja_id: item.produto.loja_id || '',
          pontos: item.produto.pontos || 0
        }
      };
    }) || [];

    return {
      id: cart.id,
      user_id: cart.user_id,
      items: processedItems,
      summary: {
        subtotal,
        shipping: subtotal > 0 ? 15.90 : 0, // Frete fixo ou grátis se carrinho vazio
        totalItems,
        totalPoints
      }
    };
  } catch (error) {
    console.error('[getCart] Error:', error);
    throw error;
  }
};
