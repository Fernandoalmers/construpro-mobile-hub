import { supabase } from "@/integrations/supabase/client";

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
