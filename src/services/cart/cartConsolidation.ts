import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure user has only one active cart by consolidating multiple carts if they exist
 * Returns the ID of the single active cart
 */
export const ensureSingleActiveCart = async (userId: string): Promise<string | null> => {
  try {
    console.log('[ensureSingleActiveCart] Starting for user:', userId);
    
    // Find all active carts for user
    const { data: carts, error } = await supabase
      .from('carts')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[ensureSingleActiveCart] Error finding carts:', error);
      return null;
    }
    
    console.log('[ensureSingleActiveCart] Found carts:', carts?.length || 0);
    
    // If no carts, create one
    if (!carts || carts.length === 0) {
      console.log('[ensureSingleActiveCart] No carts found, creating new cart');
      
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: userId,
          status: 'active'
        })
        .select('id')
        .single();
        
      if (createError) {
        console.error('[ensureSingleActiveCart] Error creating cart:', createError);
        return null;
      }
      
      console.log('[ensureSingleActiveCart] Created new cart:', newCart.id);
      return newCart.id;
    }
    
    // If exactly one cart, return it
    if (carts.length === 1) {
      console.log('[ensureSingleActiveCart] Found exactly one cart:', carts[0].id);
      return carts[0].id;
    }
    
    // Multiple carts found, consolidate them
    console.log(`[ensureSingleActiveCart] Found ${carts.length} active carts, consolidating...`);
    
    // Keep the most recent cart, move items from others
    const primaryCartId = carts[0].id;
    const otherCartIds = carts.slice(1).map(cart => cart.id);
    
    console.log('[ensureSingleActiveCart] Primary cart:', primaryCartId);
    console.log('[ensureSingleActiveCart] Other carts to merge:', otherCartIds);
    
    // For each other cart, get all items
    for (const cartId of otherCartIds) {
      // Get items from this cart
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);
        
      if (itemsError || !items) {
        console.error(`[ensureSingleActiveCart] Error getting items for cart ${cartId}:`, itemsError);
        continue;
      }
      
      console.log(`[ensureSingleActiveCart] Found ${items.length} items in cart ${cartId}`);
      
      // For each item, check if it exists in primary cart
      for (const item of items) {
        const { data: existingItem, error: existingError } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', primaryCartId)
          .eq('product_id', item.product_id)
          .maybeSingle();
          
        if (existingError && existingError.code !== 'PGRST116') {
          console.error(`[ensureSingleActiveCart] Error checking existing item:`, existingError);
          continue;
        }
        
        if (existingItem) {
          // Item exists, update quantity
          console.log(`[ensureSingleActiveCart] Updating quantity for existing item ${existingItem.id}`);
          
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + item.quantity })
            .eq('id', existingItem.id);
            
          if (updateError) {
            console.error(`[ensureSingleActiveCart] Error updating quantity:`, updateError);
          }
        } else {
          // Item doesn't exist, move it
          console.log(`[ensureSingleActiveCart] Moving item ${item.id} to primary cart`);
          
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ cart_id: primaryCartId })
            .eq('id', item.id);
            
          if (updateError) {
            console.error(`[ensureSingleActiveCart] Error moving item:`, updateError);
          }
        }
      }
      
      // Mark this cart as inactive
      console.log(`[ensureSingleActiveCart] Marking cart ${cartId} as merged`);
      
      const { error: updateCartError } = await supabase
        .from('carts')
        .update({ status: 'merged' })
        .eq('id', cartId);
        
      if (updateCartError) {
        console.error(`[ensureSingleActiveCart] Error marking cart as merged:`, updateCartError);
      }
    }
    
    console.log('[ensureSingleActiveCart] Consolidation complete, returning primary cart:', primaryCartId);
    return primaryCartId;
  } catch (error) {
    console.error('[ensureSingleActiveCart] Error ensuring single cart:', error);
    return null;
  }
};

/**
 * Consolidate all carts for a user
 */
export const consolidateUserCarts = async (userId: string): Promise<boolean> => {
  try {
    console.log('[consolidateUserCarts] Starting for user:', userId);
    const cartId = await ensureSingleActiveCart(userId);
    console.log('[consolidateUserCarts] Result:', !!cartId, 'cart ID:', cartId);
    return !!cartId;
  } catch (error) {
    console.error('[consolidateUserCarts] Error consolidating carts:', error);
    return false;
  }
};
