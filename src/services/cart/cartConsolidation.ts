import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures a user has only one active cart
 * If multiple active carts exist, consolidates them into one
 */
export const consolidateUserCarts = async (userId: string): Promise<boolean> => {
  try {
    console.log('[consolidateUserCarts] Checking carts for user:', userId);
    
    // Get all active carts for this user
    const { data: carts, error } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[consolidateUserCarts] Error fetching carts:', error);
      return false;
    }
    
    if (!carts || carts.length === 0) {
      console.log('[consolidateUserCarts] No active carts found');
      return true; // No carts to consolidate
    }
    
    if (carts.length === 1) {
      console.log('[consolidateUserCarts] User has exactly one active cart, no consolidation needed');
      return true; // Already has exactly one cart
    }
    
    console.log('[consolidateUserCarts] Found multiple active carts:', carts.length);
    
    // Keep the newest cart (first in the list since we ordered by created_at desc)
    const primaryCartId = carts[0].id;
    const cartsToMerge = carts.slice(1).map(c => c.id);
    
    console.log('[consolidateUserCarts] Primary cart:', primaryCartId, 'Carts to merge:', cartsToMerge);
    
    // For each cart to merge, move its items to the primary cart
    for (const cartId of cartsToMerge) {
      // Get items from this cart
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);
        
      if (itemsError) {
        console.error(`[consolidateUserCarts] Error fetching items for cart ${cartId}:`, itemsError);
        continue;
      }
      
      console.log(`[consolidateUserCarts] Found ${items?.length || 0} items in cart ${cartId}`);
      
      if (items && items.length > 0) {
        // For each item, check if it exists in the primary cart
        for (const item of items) {
          const { data: existingItem, error: checkError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', primaryCartId)
            .eq('product_id', item.product_id)
            .maybeSingle();
            
          if (checkError) {
            console.error('[consolidateUserCarts] Error checking existing item:', checkError);
            continue;
          }
          
          if (existingItem) {
            // Update quantity of existing item
            const { error: updateError } = await supabase
              .from('cart_items')
              .update({ quantity: existingItem.quantity + item.quantity })
              .eq('id', existingItem.id);
              
            if (updateError) {
              console.error('[consolidateUserCarts] Error updating existing item:', updateError);
            }
          } else {
            // Move item to primary cart
            const { error: moveError } = await supabase
              .from('cart_items')
              .update({ cart_id: primaryCartId })
              .eq('id', item.id);
              
            if (moveError) {
              console.error('[consolidateUserCarts] Error moving item to primary cart:', moveError);
            }
          }
        }
      }
      
      // Mark this cart as merged
      const { error: updateCartError } = await supabase
        .from('carts')
        .update({ status: 'merged' })
        .eq('id', cartId);
        
      if (updateCartError) {
        console.error('[consolidateUserCarts] Error updating cart status:', updateCartError);
      }
    }
    
    console.log('[consolidateUserCarts] Consolidation complete');
    return true;
    
  } catch (error) {
    console.error('[consolidateUserCarts] Error in consolidateUserCarts:', error);
    return false;
  }
};

/**
 * Make sure user has a single active cart and return its ID
 */
export const ensureSingleActiveCart = async (userId: string): Promise<string | null> => {
  try {
    // First, consolidate any existing carts
    await consolidateUserCarts(userId);
    
    // Get or create active cart
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (cartError && cartError.code !== 'PGRST116') {
      console.error('[ensureSingleActiveCart] Error fetching cart:', cartError);
      return null;
    }
    
    if (cartData) {
      console.log('[ensureSingleActiveCart] Found active cart:', cartData.id);
      return cartData.id;
    }
    
    // Create new cart
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert({ user_id: userId, status: 'active' })
      .select('id')
      .single();
      
    if (createError) {
      console.error('[ensureSingleActiveCart] Error creating cart:', createError);
      return null;
    }
    
    console.log('[ensureSingleActiveCart] Created new cart:', newCart.id);
    return newCart.id;
  } catch (error) {
    console.error('[ensureSingleActiveCart] Error in ensureSingleActiveCart:', error);
    return null;
  }
};
