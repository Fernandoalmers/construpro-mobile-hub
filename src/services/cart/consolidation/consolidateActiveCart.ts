import { supabase } from "@/integrations/supabase/client";
import { consolidateCartItems } from "./cartMerger";

/**
 * Ensure there is only a single active cart for the user
 * If multiple active carts are found, keep only the most recent one
 */
export async function ensureSingleActiveCart(userId: string): Promise<string | null> {
  try {
    if (!userId) {
      console.error('[consolidateActiveCart] Invalid user ID provided to ensureSingleActiveCart');
      return null;
    }
    
    console.log('[consolidateActiveCart] Checking for active carts for user:', userId);
    
    // Check for active carts
    const { data: activeCarts, error: cartsError } = await supabase
      .from('carts')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (cartsError) {
      console.error('[consolidateActiveCart] Error fetching active carts:', cartsError);
      throw cartsError;
    }
    
    console.log(`[consolidateActiveCart] Found ${activeCarts?.length || 0} active carts`);
    
    // If no active carts, create one
    if (!activeCarts || activeCarts.length === 0) {
      console.log('[consolidateActiveCart] No active cart found, creating new one');
      
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert({ user_id: userId, status: 'active' })
        .select('id')
        .single();
        
      if (createError) {
        console.error('[consolidateActiveCart] Error creating new cart:', createError);
        throw createError;
      }
      
      console.log('[consolidateActiveCart] Created new cart:', newCart.id);
      return newCart.id;
    }
    
    // If only one active cart, return its ID
    if (activeCarts.length === 1) {
      console.log(`[consolidateActiveCart] Found one active cart: ${activeCarts[0].id}`);
      return activeCarts[0].id;
    }
    
    // If multiple active carts, keep only the most recent one and consolidate items
    console.log(`[consolidateActiveCart] Multiple active carts found (${activeCarts.length}), consolidating...`);
    
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
        
        console.log(`[consolidateActiveCart] Archiving batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cartsToArchive.length / batchSize)}`);
        
        const { error: archiveError } = await supabase
          .from('carts')
          .update({ status: 'archived' })
          .in('id', batchIds);
          
        if (archiveError) {
          console.error(`[consolidateActiveCart] Error archiving batch:`, archiveError);
          // Continue with next batch even if this one failed
        } else {
          console.log(`[consolidateActiveCart] Successfully archived batch of ${batch.length} carts`);
        }
      }
    } catch (error) {
      console.error('[consolidateActiveCart] Error during cart consolidation:', error);
      // Continue anyway, at least return the most recent cart ID
    }
    
    console.log(`[consolidateActiveCart] Using most recent cart: ${mostRecentCart.id}`);
    return mostRecentCart.id;
    
  } catch (error) {
    console.error('[consolidateActiveCart] Error in ensureSingleActiveCart:', error);
    
    // Fallback: If everything fails, attempt to create a new cart
    try {
      console.log('[consolidateActiveCart] Attempting fallback: creating new cart');
      const { data: fallbackCart, error: fallbackError } = await supabase
        .from('carts')
        .insert({ user_id: userId, status: 'active' })
        .select('id')
        .single();
        
      if (fallbackError) {
        console.error('[consolidateActiveCart] Fallback failed:', fallbackError);
        return null;
      }
      
      console.log('[consolidateActiveCart] Created fallback cart:', fallbackCart.id);
      return fallbackCart.id;
    } catch (fallbackErr) {
      console.error('[consolidateActiveCart] Fallback attempt failed:', fallbackErr);
      return null;
    }
  }
}
