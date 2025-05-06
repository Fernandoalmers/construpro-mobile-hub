
import { supabase } from '@/integrations/supabase/client';
import { Cart } from '@/types/cart';

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

    // Primeiro, vamos verificar se existem múltiplos carrinhos ativos
    // e consolidar se necessário
    const { data: activeCarts, error: cartsError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (cartsError) {
      console.error('[getCart] Error checking for active carts:', cartsError);
      throw new Error(`Error fetching carts: ${cartsError.message}`);
    }

    if (activeCarts && activeCarts.length > 1) {
      console.warn(`[getCart] Found ${activeCarts.length} active carts, consolidating...`);
      
      // Buscar o carrinho mais recente
      const { data: latestCart, error: latestError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('[getCart] Error fetching latest cart:', latestError);
        throw latestError;
      }

      // Marcar os outros carrinhos como 'archived'
      if (latestCart) {
        const { error: updateError } = await supabase
          .from('carts')
          .update({ status: 'archived' })
          .eq('user_id', userId)
          .eq('status', 'active')
          .neq('id', latestCart.id);

        if (updateError) {
          console.error('[getCart] Error archiving old carts:', updateError);
        } else {
          console.log(`[getCart] Archived ${activeCarts.length - 1} old carts`);
        }
      }
    }

    // Agora buscar o único carrinho ativo
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id, user_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        // Não encontrou nenhum carrinho ativo, criar um novo
        console.log('[getCart] No active cart found, creating a new one');
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: userId, status: 'active' })
          .select('id, user_id')
          .single();

        if (createError) {
          console.error('[getCart] Error creating cart:', createError);
          throw createError;
        }

        return {
          id: newCart.id,
          user_id: newCart.user_id,
          items: [],
          summary: {
            subtotal: 0,
            shipping: 0,
            totalItems: 0,
            totalPoints: 0
          }
        };
      } else {
        console.error('[getCart] Error fetching cart:', cartError);
        throw cartError;
      }
    }

    // Buscar os itens do carrinho
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
          imagem_url,
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

    // Processar itens e calcular resumo do carrinho
    let subtotal = 0;
    let totalItems = 0;
    let totalPoints = 0;

    const processedItems = items?.map(item => {
      const preco = item.produto?.preco_promocional || item.produto?.preco || item.preco;
      const quantidade = item.quantidade || 0;
      const itemSubtotal = preco * quantidade;
      const pontos = (item.produto?.pontos || 0) * quantidade;
      
      subtotal += itemSubtotal;
      totalItems += quantidade;
      totalPoints += pontos;
      
      return {
        id: item.id,
        produto_id: item.produto_id,
        quantidade: quantidade,
        preco: preco,
        subtotal: itemSubtotal,
        produto: item.produto
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
