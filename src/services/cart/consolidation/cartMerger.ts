
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to consolidate items from source carts into a target cart
 * Improved with error handling and better transaction management
 */
export async function consolidateCartItems(sourceCartIds: string[], targetCartId: string): Promise<void> {
  if (!sourceCartIds.length || !targetCartId) {
    console.log('[consolidateCartItems] No source carts or invalid target cart, skipping consolidation');
    return;
  }
  
  console.log(`[consolidateCartItems] Consolidating items from ${sourceCartIds.length} carts into ${targetCartId}`);
  
  try {
    // Process one cart at a time
    for (const sourceCartId of sourceCartIds) {
      // Fetch items from this source cart only
      const { data: sourceItems, error: fetchError } = await supabase
        .from('cart_items')
        .select('product_id, quantity, price_at_add')
        .eq('cart_id', sourceCartId);
        
      if (fetchError) {
        console.error(`[consolidateCartItems] Error fetching items from cart ${sourceCartId}:`, fetchError);
        continue; // Skip this cart but try others
      }
      
      if (!sourceItems || sourceItems.length === 0) {
        console.log(`[consolidateCartItems] No items found in source cart ${sourceCartId}`);
        continue; // No items to move, continue to next cart
      }
      
      console.log(`[consolidateCartItems] Found ${sourceItems.length} items in cart ${sourceCartId}`);
      
      // Fetch all items in target cart
      const { data: targetItems, error: targetFetchError } = await supabase
        .from('cart_items')
        .select('id, product_id, quantity')
        .eq('cart_id', targetCartId);
        
      if (targetFetchError) {
        console.error('[consolidateCartItems] Error fetching target items:', targetFetchError);
        continue; // Skip this cart
      }
      
      // Create a map of existing products in target cart
      const existingProducts = new Map();
      (targetItems || []).forEach(item => {
        existingProducts.set(item.product_id, {
          id: item.id,
          quantity: item.quantity
        });
      });
      
      // Process each source item individually
      for (const sourceItem of sourceItems) {
        try {
          if (existingProducts.has(sourceItem.product_id)) {
            // Update quantity for existing product
            const existing = existingProducts.get(sourceItem.product_id);
            const newQuantity = existing.quantity + sourceItem.quantity;
            
            const { error: updateError } = await supabase
              .from('cart_items')
              .update({ quantity: newQuantity })
              .eq('id', existing.id);
              
            if (updateError) {
              console.error(`[consolidateCartItems] Error updating item ${existing.id}:`, updateError);
            } else {
              console.log(`[consolidateCartItems] Updated item ${existing.id} quantity to ${newQuantity}`);
            }
          } else {
            // Insert new product
            const { error: insertError } = await supabase
              .from('cart_items')
              .insert({
                cart_id: targetCartId,
                product_id: sourceItem.product_id,
                quantity: sourceItem.quantity,
                price_at_add: sourceItem.price_at_add
              });
              
            if (insertError) {
              console.error('[consolidateCartItems] Error inserting new item:', insertError);
            } else {
              console.log(`[consolidateCartItems] Inserted new item for product ${sourceItem.product_id}`);
            }
          }
        } catch (itemError) {
          console.error(`[consolidateCartItems] Error processing item for product ${sourceItem.product_id}:`, itemError);
        }
      }
    }
    
    console.log(`[consolidateCartItems] Consolidation complete`);
  } catch (error) {
    console.error('[consolidateCartItems] Error during consolidation:', error);
    throw error;
  }
}
