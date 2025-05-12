import { supabase } from "@/integrations/supabase/client";
import { archiveAbandonedCarts } from "./cartConsolidation";

/**
 * Archive carts that have been inactive for a specified period
 */
export async function cleanupAbandonedCarts(olderThanDays: number = 7): Promise<boolean> {
  return archiveAbandonedCarts(olderThanDays);
}

/**
 * Remove duplicate cart items (if somehow duplicates were created)
 * This should be rare but can happen if there are race conditions
 */
export async function cleanupDuplicateCartItems(cartId: string): Promise<boolean> {
  try {
    console.log(`[cartCleanup] Checking for duplicate items in cart ${cartId}`);
    
    // Get all items in the cart
    const { data: items, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity')
      .eq('cart_id', cartId);
      
    if (fetchError) {
      console.error('[cartCleanup] Error fetching cart items:', fetchError);
      return false;
    }
    
    if (!items || items.length === 0) {
      console.log('[cartCleanup] No items in cart, nothing to clean up');
      return true;
    }
    
    // Group items by product_id
    const productGroups = new Map();
    items.forEach(item => {
      if (!productGroups.has(item.product_id)) {
        productGroups.set(item.product_id, []);
      }
      productGroups.get(item.product_id).push(item);
    });
    
    // Check for duplicates
    let duplicatesFound = false;
    
    for (const [productId, productItems] of productGroups.entries()) {
      if (productItems.length > 1) {
        duplicatesFound = true;
        console.log(`[cartCleanup] Found ${productItems.length} duplicate items for product ${productId}`);
        
        // Calculate total quantity
        const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Keep the first item and update its quantity
        const itemToKeep = productItems[0];
        const itemsToRemove = productItems.slice(1).map(item => item.id);
        
        // Update the quantity of the item to keep
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: totalQuantity })
          .eq('id', itemToKeep.id);
          
        if (updateError) {
          console.error(`[cartCleanup] Error updating quantity for item ${itemToKeep.id}:`, updateError);
          // Continue anyway
        }
        
        // Remove duplicate items
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .in('id', itemsToRemove);
          
        if (deleteError) {
          console.error('[cartCleanup] Error deleting duplicate items:', deleteError);
          // Continue anyway
        }
      }
    }
    
    if (duplicatesFound) {
      console.log('[cartCleanup] Cleaned up duplicate cart items');
    } else {
      console.log('[cartCleanup] No duplicate items found');
    }
    
    return true;
  } catch (error) {
    console.error('[cartCleanup] Error cleaning up duplicate cart items:', error);
    return false;
  }
}
