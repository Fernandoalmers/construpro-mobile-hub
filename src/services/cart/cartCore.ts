
import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";

/**
 * Consolidate multiple active carts for a user into one
 */
export const consolidateUserCarts = async (userId: string): Promise<void> => {
  try {
    // Get all active carts for user
    const { data: carts, error } = await supabase
      .from('carts')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user carts:', error);
      return;
    }
    
    // If there's only 0 or 1 cart, no need to consolidate
    if (!carts || carts.length <= 1) {
      return;
    }
    
    console.log(`Found ${carts.length} active carts for user, consolidating...`);
    
    // Keep the most recent cart and move items from other carts to it
    const primaryCart = carts[0];
    const cartIdsToMerge = carts.slice(1).map(cart => cart.id);
    
    // Transfer all items from other carts to primary cart
    for (const cartId of cartIdsToMerge) {
      // Get items from cart to merge
      const { data: itemsToMove, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);
        
      if (itemsError) {
        console.error(`Error fetching items from cart ${cartId}:`, itemsError);
        continue;
      }
      
      if (itemsToMove && itemsToMove.length > 0) {
        console.log(`Moving ${itemsToMove.length} items from cart ${cartId} to ${primaryCart.id}`);
        
        // For each item to move
        for (const item of itemsToMove) {
          // Check if the product already exists in primary cart
          const { data: existingItem, error: checkError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', primaryCart.id)
            .eq('product_id', item.product_id)
            .maybeSingle();
            
          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking for existing item:', checkError);
            continue;
          }
          
          if (existingItem) {
            // Update quantity of existing item
            const newQuantity = existingItem.quantity + item.quantity;
            const { error: updateError } = await supabase
              .from('cart_items')
              .update({ quantity: newQuantity })
              .eq('id', existingItem.id);
              
            if (updateError) {
              console.error('Error updating item quantity:', updateError);
            }
          } else {
            // Add item to primary cart
            const { error: insertError } = await supabase
              .from('cart_items')
              .insert({
                cart_id: primaryCart.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_add: item.price_at_add
              });
              
            if (insertError) {
              console.error('Error moving item to primary cart:', insertError);
            }
          }
        }
      }
      
      // Delete items from the old cart
      const { error: deleteItemsError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);
        
      if (deleteItemsError) {
        console.error(`Error deleting items from cart ${cartId}:`, deleteItemsError);
      }
      
      // Fix: Update cart status to 'inactive' instead of trying to set 'merged'
      // which might not be an allowed value in the status constraint
      const { error: updateCartError } = await supabase
        .from('carts')
        .update({ status: 'inactive' })
        .eq('id', cartId);
        
      if (updateCartError) {
        console.error(`Error updating cart ${cartId} status:`, updateCartError);
      }
    }
    
    console.log('Cart consolidation complete');
  } catch (error) {
    console.error('Error in consolidateUserCarts:', error);
  }
};

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
 * Create a new cart for the user
 */
export const createCart = async (userId: string): Promise<string | null> => {
  try {
    // Create a new cart
    const { data: cart, error } = await supabase
      .from('carts')
      .insert({ 
        user_id: userId,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating cart:', error);
      return null;
    }

    return cart.id;
  } catch (error) {
    console.error('Error in createCart:', error);
    return null;
  }
};

/**
 * Clear cart items and mark the cart as cleared/inactive
 */
export const clearCart = async (): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Get active cart
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return false;
    }

    // Delete all cart items
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartData.id);

    if (deleteError) {
      console.error('Error clearing cart:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};
