
import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";
import { consolidateUserCarts } from "./cartConsolidation";

/**
 * Get cart for the current user
 */
export const getCart = async (): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // First, let's consolidate user's carts to ensure consistency
    await consolidateUserCarts(userData.user.id);

    // Get active cart, ordered by most recent first
    let { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        // No active cart found, create one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ 
            user_id: userData.user.id,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating cart:', createError);
          return null;
        }

        cartData = newCart;
        console.log('Created new cart:', cartData.id);
      } else {
        console.error('Error fetching cart:', cartError);
        return null;
      }
    } else {
      console.log('Found active cart:', cartData.id);
    }

    // Get cart items with product information from 'produtos' table
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        price_at_add,
        produtos:product_id (
          id,
          nome,
          preco_normal,
          preco_promocional,
          imagens,
          estoque,
          vendedor_id,
          pontos_consumidor
        )
      `)
      .eq('cart_id', cartData.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return null;
    }

    // Process cart items
    const cartItems = (items || []).map(item => {
      // Extract first image from imagens array if available
      let imageUrl: string | undefined;
      if (item.produtos && item.produtos.imagens && Array.isArray(item.produtos.imagens) && item.produtos.imagens.length > 0) {
        // Ensure we're converting to string if the image is not already a string
        imageUrl = String(item.produtos.imagens[0]);
      }

      return {
        id: item.id,
        produto: item.produtos ? {
          id: item.produtos.id,
          nome: item.produtos.nome,
          preco: item.produtos.preco_promocional || item.produtos.preco_normal,
          pontos: item.produtos.pontos_consumidor,
          imagem_url: imageUrl,
          loja_id: item.produtos.vendedor_id,
          estoque: item.produtos.estoque || 0
        } : undefined,
        produto_id: item.product_id,
        quantidade: item.quantity,
        preco: item.price_at_add,
        subtotal: item.price_at_add * item.quantity,
        pontos: item.produtos?.pontos_consumidor
      };
    });

    // Get store information for items in cart
    const storeIds = [...new Set(cartItems.map(item => item.produto?.loja_id).filter(Boolean))];
    let stores = [];
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, nome, logo_url')
        .in('id', storeIds);

      stores = storesData || [];
    }

    // Calculate summary
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = storeIds.length * 15.9; // Fixed shipping per store
    const totalPoints = cartItems.reduce((sum, item) => sum + ((item.produto?.pontos || 0) * item.quantidade), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantidade, 0);

    // Save cart data to localStorage as a fallback for CartPopup
    try {
      localStorage.setItem('cartData', JSON.stringify({
        id: cartData.id,
        summary: {
          subtotal,
          shipping,
          totalPoints,
          totalItems
        }
      }));
    } catch (err) {
      console.warn('Could not save cart to localStorage:', err);
    }

    return {
      id: cartData.id,
      user_id: userData.user.id,
      items: cartItems,
      summary: {
        subtotal,
        shipping,
        totalPoints,
        totalItems
      },
      stores
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

/**
 * Fetch user's cart
 */
export const fetchCart = async (userId: string) => {
  try {
    return await getCart();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};
