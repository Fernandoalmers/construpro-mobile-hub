import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure user has only one active cart by consolidating multiple carts if they exist
 * Returns the ID of the single active cart
 */
export const ensureSingleActiveCart = async (userId: string): Promise<string | null> => {
  try {
    // Find all active carts for user
    const { data: carts, error } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error finding carts:', error);
      return null;
    }
    
    // If no carts, create one
    if (!carts || carts.length === 0) {
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({
          user_id: userId,
          status: 'active'
        })
        .select('id')
        .single();
        
      if (createError) {
        console.error('Error creating cart:', createError);
        return null;
      }
      
      return newCart.id;
    }
    
    // If exactly one cart, return it
    if (carts.length === 1) {
      return carts[0].id;
    }
    
    // Multiple carts found, consolidate them
    console.log(`Found ${carts.length} active carts, consolidating...`);
    
    // Keep the most recent cart, move items from others
    const primaryCartId = carts[0].id;
    const otherCartIds = carts.slice(1).map(cart => cart.id);
    
    // For each other cart, get all items
    for (const cartId of otherCartIds) {
      // Get items from this cart
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId);
        
      if (itemsError || !items) {
        console.error(`Error getting items for cart ${cartId}:`, itemsError);
        continue;
      }
      
      // For each item, check if it exists in primary cart
      for (const item of items) {
        const { data: existingItem, error: existingError } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', primaryCartId)
          .eq('product_id', item.product_id)
          .maybeSingle();
          
        if (existingError && existingError.code !== 'PGRST116') {
          console.error(`Error checking existing item:`, existingError);
          continue;
        }
        
        if (existingItem) {
          // Item exists, update quantity
          await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + item.quantity })
            .eq('id', existingItem.id);
        } else {
          // Item doesn't exist, move it
          await supabase
            .from('cart_items')
            .update({ cart_id: primaryCartId })
            .eq('id', item.id);
        }
      }
      
      // Mark this cart as inactive
      await supabase
        .from('carts')
        .update({ status: 'merged' })
        .eq('id', cartId);
    }
    
    return primaryCartId;
  } catch (error) {
    console.error('Error ensuring single cart:', error);
    return null;
  }
};

/**
 * Consolidate all carts for a user
 */
export const consolidateUserCarts = async (userId: string): Promise<boolean> => {
  try {
    const cartId = await ensureSingleActiveCart(userId);
    return !!cartId;
  } catch (error) {
    console.error('Error consolidating carts:', error);
    return false;
  }
};
