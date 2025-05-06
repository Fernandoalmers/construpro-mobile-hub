import { supabase } from "@/integrations/supabase/client";

/**
 * Consolidates multiple active carts for a user into a single cart
 * This helps avoid data inconsistencies when multiple active carts are created
 */
export const consolidateUserCarts = async (userId: string): Promise<void> => {
  try {
    console.log('[consolidateUserCarts] Starting consolidation for user:', userId);
    
    // Find all active carts for the user
    const { data: carts, error: cartError } = await supabase
      .from('carts')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (cartError) {
      console.error('[consolidateUserCarts] Error fetching carts:', cartError);
      return;
    }
    
    // If there's 0 or 1 cart, no consolidation needed
    if (!carts || carts.length <= 1) {
      console.log('[consolidateUserCarts] No consolidation needed');
      return;
    }
    
    console.log(`[consolidateUserCarts] Found ${carts.length} active carts, will consolidate`);
    
    // Keep the most recent cart
    const primaryCartId = carts[0].id;
    const cartsToMerge = carts.slice(1);
    
    for (const cart of cartsToMerge) {
      // Get items from this cart
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id);
      
      if (itemsError) {
        console.error(`[consolidateUserCarts] Error fetching items for cart ${cart.id}:`, itemsError);
        continue;
      }
      
      if (!items || items.length === 0) {
        // Empty cart, just mark as inactive
        console.log(`[consolidateUserCarts] Cart ${cart.id} is empty, marking as inactive`);
      } else {
        // Move items to primary cart
        console.log(`[consolidateUserCarts] Moving ${items.length} items from cart ${cart.id} to ${primaryCartId}`);
        
        for (const item of items) {
          // Check if this product already exists in primary cart
          const { data: existingItem, error: existingError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', primaryCartId)
            .eq('product_id', item.product_id)
            .maybeSingle();
          
          if (existingError && existingError.code !== 'PGRST116') {
            console.error('[consolidateUserCarts] Error checking existing item:', existingError);
            continue;
          }
          
          if (existingItem) {
            // Update quantity of existing item
            await supabase
              .from('cart_items')
              .update({ quantity: existingItem.quantity + item.quantity })
              .eq('id', existingItem.id);
          } else {
            // Move item to primary cart
            await supabase
              .from('cart_items')
              .insert({
                cart_id: primaryCartId,
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_add: item.price_at_add
              });
          }
          
          // Delete the original item
          await supabase
            .from('cart_items')
            .delete()
            .eq('id', item.id);
        }
      }
      
      // Mark this cart as merged/inactive
      await supabase
        .from('carts')
        .update({ status: 'merged' })
        .eq('id', cart.id);
    }
    
    console.log('[consolidateUserCarts] Cart consolidation completed successfully');
    
  } catch (error) {
    console.error('[consolidateUserCarts] Error during cart consolidation:', error);
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
