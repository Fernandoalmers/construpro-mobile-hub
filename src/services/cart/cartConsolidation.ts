
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure there is only a single active cart for the user
 * If multiple active carts are found, keep only the most recent one
 */
export async function ensureSingleActiveCart(userId: string): Promise<string | null> {
  try {
    if (!userId) {
      console.error('Invalid user ID provided to ensureSingleActiveCart');
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
    
    // If multiple active carts, keep only the most recent one
    if (activeCarts.length > 1) {
      console.warn(`[cartConsolidation] Multiple active carts found (${activeCarts.length}), consolidating...`);
      
      const mostRecentCart = activeCarts[0]; // Already sorted by created_at desc
      const cartsToArchive = activeCarts.slice(1);
      
      if (cartsToArchive.length > 0) {
        try {
          // If there are too many carts to archive at once, do it in batches
          if (cartsToArchive.length > 100) {
            console.log(`[cartConsolidation] Large number of carts (${cartsToArchive.length}), processing in batches`);
            
            // First, consolidate items from the older carts into the most recent one
            await consolidateCartItems(cartsToArchive.map(c => c.id), mostRecentCart.id);
            
            // Then archive carts in batches to avoid query size limits
            const batchSize = 50;
            for (let i = 0; i < cartsToArchive.length; i += batchSize) {
              const batch = cartsToArchive.slice(i, i + batchSize);
              const batchIds = batch.map(cart => cart.id);
              
              console.log(`[cartConsolidation] Archiving batch ${i / batchSize + 1}/${Math.ceil(cartsToArchive.length / batchSize)}`);
              
              const { error: batchError } = await supabase
                .from('carts')
                .update({ status: 'archived' })
                .in('id', batchIds);
                
              if (batchError) {
                console.error(`[cartConsolidation] Error archiving batch ${i / batchSize + 1}:`, batchError);
                // Continue with the process - at least we've moved the items
              } else {
                console.log(`[cartConsolidation] Successfully archived batch ${i / batchSize + 1}`);
              }
            }
          } else {
            // For a smaller number of carts, first consolidate items
            await consolidateCartItems(cartsToArchive.map(c => c.id), mostRecentCart.id);
            
            // Then archive all carts at once
            const cartsToArchiveIds = cartsToArchive.map(cart => cart.id);
            const { error: updateError } = await supabase
              .from('carts')
              .update({ status: 'archived' })
              .in('id', cartsToArchiveIds);
              
            if (updateError) {
              console.error('[cartConsolidation] Error archiving old carts:', updateError);
              // Continue with the most recent cart anyway since we've consolidated items
            } else {
              console.log(`[cartConsolidation] Archived ${cartsToArchive.length} old carts`);
            }
          }
        } catch (consolidateError) {
          console.error('[cartConsolidation] Error during cart consolidation:', consolidateError);
          // Continue with the most recent cart even if consolidation failed
        }
      }
      
      console.log(`[cartConsolidation] Using most recent cart: ${mostRecentCart.id}`);
      return mostRecentCart.id;
    }
    
    // Only one active cart, return its ID
    console.log(`[cartConsolidation] Using existing cart: ${activeCarts[0].id}`);
    return activeCarts[0].id;
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
 */
async function consolidateCartItems(sourceCartIds: string[], targetCartId: string): Promise<void> {
  if (!sourceCartIds.length || !targetCartId) return;
  
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
    const itemsToUpdate = [];
    const itemsToInsert = [];
    
    groupedSourceItems.forEach((sourceItem, productId) => {
      if (existingProducts.has(productId)) {
        // Update quantity for existing product
        const existing = existingProducts.get(productId);
        itemsToUpdate.push({
          id: existing.id,
          quantity: existing.quantity + sourceItem.quantity
        });
      } else {
        // Insert new product
        itemsToInsert.push({
          cart_id: targetCartId,
          product_id: sourceItem.product_id,
          quantity: sourceItem.quantity,
          price_at_add: sourceItem.price_at_add
        });
      }
    });
    
    // Update existing items (if any)
    if (itemsToUpdate.length > 0) {
      // Update items in batches if there are many
      const updateBatchSize = 50;
      for (let i = 0; i < itemsToUpdate.length; i += updateBatchSize) {
        const batch = itemsToUpdate.slice(i, i + updateBatchSize);
        
        for (const item of batch) {
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: item.quantity })
            .eq('id', item.id);
            
          if (updateError) {
            console.error(`[consolidateCartItems] Error updating item ${item.id}:`, updateError);
          }
        }
      }
    }
    
    // Insert new items (if any)
    if (itemsToInsert.length > 0) {
      // Insert items in batches if there are many
      const insertBatchSize = 50;
      for (let i = 0; i < itemsToInsert.length; i += insertBatchSize) {
        const batch = itemsToInsert.slice(i, i + insertBatchSize);
        
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert(batch);
          
        if (insertError) {
          console.error('[consolidateCartItems] Error inserting batch of items:', insertError);
        }
      }
    }
    
    console.log(`[consolidateCartItems] Consolidation complete: Updated ${itemsToUpdate.length} items, inserted ${itemsToInsert.length} items`);
    
  } catch (error) {
    console.error('[consolidateCartItems] Error during consolidation:', error);
    throw error;
  }
}
