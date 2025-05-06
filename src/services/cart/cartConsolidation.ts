
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure user has only one active cart
 * @param userId The user ID
 * @returns The ID of the active cart
 */
export const ensureSingleActiveCart = async (userId: string): Promise<string | null> => {
  try {
    console.log('[ensureSingleActiveCart] Ensuring single active cart for user:', userId);
    
    // Get all carts for user
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (cartsError) {
      console.error('[ensureSingleActiveCart] Error fetching carts:', cartsError);
      return null;
    }
    
    console.log('[ensureSingleActiveCart] Found', carts?.length || 0, 'carts for user');
    
    // If no carts, create one
    if (!carts || carts.length === 0) {
      console.log('[ensureSingleActiveCart] No carts found, creating new cart');
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({ user_id: userId, status: 'active' })
        .select('id')
        .single();
        
      if (createError) {
        console.error('[ensureSingleActiveCart] Error creating cart:', createError);
        return null;
      }
      
      return newCart.id;
    }
    
    // Find active carts
    const activeCarts = carts.filter(cart => cart.status === 'active');
    console.log('[ensureSingleActiveCart] Found', activeCarts.length, 'active carts');
    
    // If no active carts, make the newest cart active
    if (activeCarts.length === 0) {
      const newestCartId = carts[0].id;
      console.log('[ensureSingleActiveCart] No active carts, updating newest cart:', newestCartId);
      
      const { error: updateError } = await supabase
        .from('carts')
        .update({ status: 'active' })
        .eq('id', newestCartId);
        
      if (updateError) {
        console.error('[ensureSingleActiveCart] Error updating cart status:', updateError);
        return null;
      }
      
      return newestCartId;
    }
    
    // If multiple active carts, merge them
    if (activeCarts.length > 1) {
      return await mergeActiveCarts(userId, activeCarts);
    }
    
    // Already has exactly one active cart
    return activeCarts[0].id;
  } catch (error) {
    console.error('[ensureSingleActiveCart] Error:', error);
    return null;
  }
};

/**
 * Merge multiple active carts into one
 * @param userId User ID
 * @param activeCarts Array of active carts
 * @returns ID of the consolidated cart
 */
const mergeActiveCarts = async (userId: string, activeCarts: any[]): Promise<string | null> => {
  try {
    console.log('[mergeActiveCarts] Merging', activeCarts.length, 'active carts');
    
    // Sort carts by creation date (newest first)
    activeCarts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Get most recent cart as the primary cart
    const primaryCartId = activeCarts[0].id;
    console.log('[mergeActiveCarts] Primary cart:', primaryCartId);
    
    // Get all other cart IDs to merge
    const cartsToMerge = activeCarts.slice(1).map(cart => cart.id);
    console.log('[mergeActiveCarts] Carts to merge:', cartsToMerge);
    
    if (cartsToMerge.length === 0) {
      return primaryCartId;
    }
    
    // For each cart to merge
    for (const cartId of cartsToMerge) {
      // Get cart items
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('product_id, quantity, price_at_add')
        .eq('cart_id', cartId);
        
      if (itemsError) {
        console.error(`[mergeActiveCarts] Error fetching items for cart ${cartId}:`, itemsError);
        continue;
      }
      
      console.log(`[mergeActiveCarts] Found ${cartItems?.length || 0} items in cart ${cartId}`);
      
      // Move each item to primary cart
      for (const item of cartItems || []) {
        // Check if product already exists in primary cart
        const { data: existingItem, error: existingError } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', primaryCartId)
          .eq('product_id', item.product_id)
          .maybeSingle();
          
        if (existingError && existingError.code !== 'PGRST116') {
          console.error('[mergeActiveCarts] Error checking existing item:', existingError);
          continue;
        }
        
        if (existingItem) {
          // Update quantity in primary cart
          console.log(`[mergeActiveCarts] Updating existing item ${existingItem.id} quantity from ${existingItem.quantity} to ${existingItem.quantity + item.quantity}`);
          
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + item.quantity })
            .eq('id', existingItem.id);
            
          if (updateError) {
            console.error('[mergeActiveCarts] Error updating quantity:', updateError);
          }
        } else {
          // Add new item to primary cart
          console.log(`[mergeActiveCarts] Adding new item to primary cart: ${item.product_id}`);
          
          const { error: insertError } = await supabase
            .from('cart_items')
            .insert({
              cart_id: primaryCartId,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_add: item.price_at_add
            });
            
          if (insertError) {
            console.error('[mergeActiveCarts] Error inserting item:', insertError);
          }
        }
      }
      
      // Mark the merged cart as inactive
      console.log(`[mergeActiveCarts] Marking cart ${cartId} as inactive`);
      
      const { error: updateError } = await supabase
        .from('carts')
        .update({ status: 'merged' })
        .eq('id', cartId);
        
      if (updateError) {
        console.error(`[mergeActiveCarts] Error updating cart ${cartId} status:`, updateError);
      }
    }
    
    console.log('[mergeActiveCarts] Successfully merged all carts');
    return primaryCartId;
  } catch (error) {
    console.error('[mergeActiveCarts] Error merging carts:', error);
    return null;
  }
};

/**
 * Consolidate all user carts to have only one active cart
 * @param userId The user ID
 * @returns true if consolidated successfully
 */
export const consolidateUserCarts = async (userId: string): Promise<boolean> => {
  try {
    console.log('[consolidateUserCarts] Starting consolidation for user:', userId);
    const result = await ensureSingleActiveCart(userId);
    console.log('[consolidateUserCarts] Consolidation completed, active cart:', result);
    return result !== null;
  } catch (error) {
    console.error('[consolidateUserCarts] Error consolidating carts:', error);
    return false;
  }
};
