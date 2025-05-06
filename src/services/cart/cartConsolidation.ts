
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
        const cartsToArchiveIds = cartsToArchive.map(cart => cart.id);
        
        // Archive older carts by updating status - use "archived" which is a valid value per the check constraint
        const { error: updateError } = await supabase
          .from('carts')
          .update({ status: 'archived' })
          .in('id', cartsToArchiveIds);
          
        if (updateError) {
          console.error('[cartConsolidation] Error archiving old carts:', updateError);
          // Continue with the most recent cart anyway
        } else {
          console.log(`[cartConsolidation] Archived ${cartsToArchive.length} old carts`);
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
    return null;
  }
}
