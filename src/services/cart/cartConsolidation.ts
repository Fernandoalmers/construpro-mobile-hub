import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure there is only a single active cart for the user
 * If multiple active carts are found, keep only the most recent one
 */
export async function ensureSingleActiveCart(userId: string): Promise<string | null> {
  try {
    if (!userId) {
      console.error('[cartConsolidation] Invalid user ID provided to ensureSingleActiveCart');
      return null;
    }
    
    console.log('[cartConsolidation] Checking for active carts for user:', userId);
    
    // Check for active carts
    const { data: activeCarts, error: cartsError } = await supabase
      .from('carts')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (cartsError) {
      console.error('[cartConsolidation] Error fetching active carts:', cartsError);
      throw cartsError;
    }
    
    console.log(`[cartConsolidation] Found ${activeCarts?.length || 0} active carts`);
    
    // If no active carts, create one
    if (!activeCarts || activeCarts.length === 0) {
      console.log('[cartConsolidation] No active cart found, creating new one');
      
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({ user_id: userId, status: 'active' })
        .select('id')
        .single();
        
      if (createError) {
        console.error('[cartConsolidation] Error creating new cart:', createError);
        throw createError;
      }
      
      console.log('[cartConsolidation] Created new cart:', newCart.id);
      return newCart.id;
    }
    
    // If only one active cart, return its ID
    if (activeCarts.length === 1) {
      console.log(`[cartConsolidation] Found one active cart: ${activeCarts[0].id}`);
      return activeCarts[0].id;
    }
    
    // If multiple active carts, keep only the most recent one and consolidate items
    console.log(`[cartConsolidation] Multiple active carts found (${activeCarts.length}), consolidating...`);
    
    const mostRecentCart = activeCarts[0]; // Already sorted by created_at desc
    const cartsToArchive = activeCarts.slice(1);
    
    try {
      // First consolidate items from old carts to the most recent cart
      await consolidateCartItems(cartsToArchive.map(c => c.id), mostRecentCart.id);
      
      // Archive old carts in smaller batches to avoid timeouts
      const batchSize = 10;
      for (let i = 0; i < cartsToArchive.length; i += batchSize) {
        const batch = cartsToArchive.slice(i, i + batchSize);
        const batchIds = batch.map(cart => cart.id);
        
        console.log(`[cartConsolidation] Archiving batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cartsToArchive.length / batchSize)}`);
        
        const { error: archiveError } = await supabase
          .from('carts')
          .update({ status: 'archived' })
          .in('id', batchIds);
          
        if (archiveError) {
          console.error(`[cartConsolidation] Error archiving batch:`, archiveError);
          // Continue with next batch even if this one failed
        } else {
          console.log(`[cartConsolidation] Successfully archived batch of ${batch.length} carts`);
        }
      }
    } catch (error) {
      console.error('[cartConsolidation] Error during cart consolidation:', error);
      // Continue anyway, at least return the most recent cart ID
    }
    
    console.log(`[cartConsolidation] Using most recent cart: ${mostRecentCart.id}`);
    return mostRecentCart.id;
    
  } catch (error) {
    console.error('[cartConsolidation] Error in ensureSingleActiveCart:', error);
    
    // Fallback: If everything fails, attempt to create a new cart
    try {
      console.log('[cartConsolidation] Attempting fallback: creating new cart');
      const { data: fallbackCart, error: fallbackError } = await supabase
        .from('carts')
        .insert({ user_id: userId, status: 'active' })
        .select('id')
        .single();
        
      if (fallbackError) {
        console.error('[cartConsolidation] Fallback failed:', fallbackError);
        return null;
      }
      
      console.log('[cartConsolidation] Created fallback cart:', fallbackCart.id);
      return fallbackCart.id;
    } catch (fallbackErr) {
      console.error('[cartConsolidation] Fallback attempt failed:', fallbackErr);
      return null;
    }
  }
}

/**
 * Helper function to consolidate items from source carts into a target cart
 * Improved with error handling and better transaction management
 */
async function consolidateCartItems(sourceCartIds: string[], targetCartId: string): Promise<void> {
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

/**
 * Archive carts that have been inactive for a specified period
 */
export async function archiveAbandonedCarts(olderThanDays: number = 7): Promise<boolean> {
  try {
    console.log(`[cartConsolidation] Archiving carts older than ${olderThanDays} days`);
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Find active carts older than the cutoff date
    const { data: oldCarts, error: findError } = await supabase
      .from('carts')
      .select('id')
      .eq('status', 'active')
      .lt('updated_at', cutoffDate.toISOString())
      .limit(100); // Process in smaller batches
      
    if (findError) {
      console.error('[cartConsolidation] Error finding old carts:', findError);
      return false;
    }
    
    if (!oldCarts || oldCarts.length === 0) {
      console.log('[cartConsolidation] No abandoned carts found');
      return true;
    }
    
    console.log(`[cartConsolidation] Found ${oldCarts.length} abandoned carts to archive`);
    
    // Archive in smaller batches
    const batchSize = 20;
    const cartIds = oldCarts.map(cart => cart.id);
    
    for (let i = 0; i < cartIds.length; i += batchSize) {
      const batch = cartIds.slice(i, i + batchSize);
      
      const { error: updateError } = await supabase
        .from('carts')
        .update({ status: 'archived' })
        .in('id', batch);
        
      if (updateError) {
        console.error(`[cartConsolidation] Error archiving batch ${i / batchSize + 1}:`, updateError);
      } else {
        console.log(`[cartConsolidation] Successfully archived batch ${i / batchSize + 1}, ${batch.length} carts`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[cartConsolidation] Error archiving abandoned carts:', error);
    return false;
  }
}
