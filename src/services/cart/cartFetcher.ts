
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

    console.log('[getCart] Getting cart for user:', userData.user.id);

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

    // Get cart items
    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartData.id);

    if (cartItemsError) {
      console.error('Error fetching cart items:', cartItemsError);
      return null;
    }

    console.log('[cart → query]', cartItems);

    // If there are no items, return empty cart
    if (!cartItems || cartItems.length === 0) {
      return {
        id: cartData.id,
        user_id: userData.user.id,
        items: [],
        summary: {
          subtotal: 0,
          shipping: 0,
          totalItems: 0,
          totalPoints: 0
        },
        stores: []
      };
    }

    // Get product information separately for each item
    const productIds = cartItems.map(item => item.product_id);
    
    // Get product details
    const { data: products, error: productsError } = await supabase
      .from('produtos')
      .select(`
        id, 
        nome, 
        preco_normal, 
        preco_promocional, 
        imagens, 
        estoque,
        vendedor_id,
        pontos_consumidor
      `)
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return null;
    }

    console.log('[cart → product]', products);

    // Get store information
    const vendorIds = [...new Set(products?.map(product => product.vendedor_id).filter(Boolean) || [])];
    
    let stores = [];
    if (vendorIds.length > 0) {
      const { data: storesData, error: storesError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .in('id', vendorIds);
        
      if (!storesError && storesData) {
        stores = storesData.map(store => ({
          id: store.id,
          nome: store.nome_loja,
          logo_url: null
        }));
      }
    }

    // Format cart items with product details
    const formattedItems = cartItems.map(cartItem => {
      const product = products?.find(p => p.id === cartItem.product_id);
      
      if (!product) {
        console.warn('Product not found for cart item:', cartItem.product_id);
        return null;
      }
      
      // Extract first image from imagens array if available
      let imageUrl = null;
      if (product.imagens && Array.isArray(product.imagens) && product.imagens.length > 0) {
        imageUrl = String(product.imagens[0]);
      }
      
      const preco = cartItem.price_at_add;
      const quantidade = cartItem.quantity;
      const subtotal = preco * quantidade;
      
      return {
        id: cartItem.id,
        produto_id: cartItem.product_id,
        quantidade,
        preco,
        subtotal,
        produto: {
          id: product.id,
          nome: product.nome,
          preco: product.preco_promocional || product.preco_normal,
          imagem_url: imageUrl,
          estoque: product.estoque || 0,
          loja_id: product.vendedor_id,
          pontos: product.pontos_consumidor || 0
        }
      };
    }).filter(Boolean);

    // Calculate summary
    const subtotal = formattedItems.reduce((sum, item) => sum + (item?.subtotal || 0), 0);
    const totalItems = formattedItems.reduce((sum, item) => sum + (item?.quantidade || 0), 0);
    const shipping = stores.length * 15.90; // Fixed shipping per store
    const totalPoints = formattedItems.reduce((sum, item) => 
      sum + ((item?.produto?.pontos || 0) * (item?.quantidade || 0)), 0);

    // Save cart data to localStorage as a fallback
    try {
      localStorage.setItem('cartData', JSON.stringify({
        id: cartData.id,
        summary: {
          subtotal,
          shipping,
          totalItems,
          totalPoints
        }
      }));
    } catch (err) {
      console.warn('Could not save cart to localStorage:', err);
    }

    console.log('Returning formatted cart with', formattedItems.length, 'items');

    return {
      id: cartData.id,
      user_id: userData.user.id,
      items: formattedItems as any[],
      summary: {
        subtotal,
        shipping,
        totalItems,
        totalPoints
      },
      stores
    };
  } catch (error) {
    console.error('Error in getCart:', error);
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
