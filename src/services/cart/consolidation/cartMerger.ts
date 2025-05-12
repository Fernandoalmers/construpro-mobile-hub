
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
    // Fetch all cart items from the source carts
    const { data: sourceItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('product_id, quantity, price_at_add')
      .in('cart_id', sourceCartIds);
      
    if (fetchError) {
      console.error('[consolidateCartItems] Error fetching source items:', fetchError);
      throw fetchError;
    }
    
    if (!sourceItems || sourceItems.length === 0) {
      console.log('[consolidateCartItems] No items found in source carts');
      return;
    }
    
    console.log(`[consolidateCartItems] Found ${sourceItems.length} items to consolidate`);
    
    // Fetch target cart items to check for duplicates
    const { data: targetItems, error: targetFetchError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity')
      .eq('cart_id', targetCartId);
      
    if (targetFetchError) {
      console.error('[consolidateCartItems] Error fetching target items:', targetFetchError);
      throw targetFetchError;
    }
    
    // Create a map of existing products in target cart
    const existingProducts = new Map();
    (targetItems || []).forEach(item => {
      existingProducts.set(item.product_id, {
        id: item.id,
        quantity: item.quantity
      });
    });
    
    // Group source items by product_id to combine quantities
    const groupedSourceItems = new Map();
    sourceItems.forEach(item => {
      if (groupedSourceItems.has(item.product_id)) {
        const existing = groupedSourceItems.get(item.product_id);
        existing.quantity += item.quantity;
      } else {
        groupedSourceItems.set(item.product_id, {
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_add: item.price_at_add
        });
      }
    });
    
    // Process items: update existing or insert new
    let successCount = 0;
    let errorCount = 0;
    
    // First update existing items
    for (const [productId, sourceItem] of groupedSourceItems.entries()) {
      try {
        if (existingProducts.has(productId)) {
          // Update quantity for existing product
          const existing = existingProducts.get(productId);
          const newQuantity = existing.quantity + sourceItem.quantity;
          
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', existing.id);
            
          if (updateError) {
            console.error(`[consolidateCartItems] Error updating item ${existing.id}:`, updateError);
            errorCount++;
          } else {
            console.log(`[consolidateCartItems] Updated item ${existing.id} quantity to ${newQuantity}`);
            successCount++;
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
            errorCount++;
          } else {
            console.log(`[consolidateCartItems] Inserted new item for product ${sourceItem.product_id}`);
            successCount++;
          }
        }
      } catch (itemError) {
        console.error(`[consolidateCartItems] Error processing item for product ${productId}:`, itemError);
        errorCount++;
      }
    }
    
    console.log(`[consolidateCartItems] Consolidation complete: Success: ${successCount}, Errors: ${errorCount}`);
    
    // If we had too many errors, throw an error to indicate consolidation wasn't fully successful
    if (errorCount > successCount) {
      throw new Error(`Consolidation partially failed: ${errorCount} errors vs ${successCount} successes`);
    }
    
  } catch (error) {
    console.error('[consolidateCartItems] Error during consolidation:', error);
    throw error;
  }
}
