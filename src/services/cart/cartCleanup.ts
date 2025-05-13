
import { supabase } from '@/integrations/supabase/client';

/**
 * Clean up abandoned carts for the current user
 */
export async function cleanupAbandonedCarts(): Promise<void> {
  try {
    console.log('[cartCleanup] Running cart cleanup');
    
    // Get current user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      console.log('[cartCleanup] No authenticated user, skipping cleanup');
      return;
    }
    
    const userId = userData.user.id;
    
    // Get all carts for this user
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select('id, status, created_at')
      .eq('user_id', userId);
      
    if (cartsError) {
      console.error('[cartCleanup] Error fetching carts:', cartsError);
      return;
    }
    
    if (!carts || carts.length === 0) {
      console.log('[cartCleanup] No carts found for user');
      return;
    }
    
    console.log(`[cartCleanup] Found ${carts.length} carts for user`);
    
    // Find active carts - should only be one
    const activeCarts = carts.filter(cart => cart.status === 'active');
    
    if (activeCarts.length <= 1) {
      console.log('[cartCleanup] User has 0-1 active carts, no cleanup needed');
      return;
    }
    
    // Keep most recent active cart
    activeCarts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const keepCartId = activeCarts[0].id;
    const cartsToArchive = activeCarts.slice(1).map(cart => cart.id);
    
    console.log(`[cartCleanup] Keeping cart ${keepCartId}, archiving ${cartsToArchive.length} carts`);
    
    // Archive old carts in batches
    const batchSize = 10;
    for (let i = 0; i < cartsToArchive.length; i += batchSize) {
      const batch = cartsToArchive.slice(i, i + batchSize);
      
      const { error: archiveError } = await supabase
        .from('carts')
        .update({ status: 'abandoned' }) // Changed from 'archived' to 'abandoned' to match DB constraint
        .in('id', batch);
        
      if (archiveError) {
        console.error('[cartCleanup] Error archiving carts:', archiveError);
      }
    }
    
    console.log('[cartCleanup] Cleanup complete');
  } catch (error) {
    console.error('[cartCleanup] Error during cart cleanup:', error);
  }
}

/**
 * Remove empty carts (carts with no items) for the current user
 */
export async function removeEmptyCarts(): Promise<void> {
  try {
    console.log('[cartCleanup] Running empty cart cleanup');
    
    // Get current user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      console.log('[cartCleanup] No authenticated user, skipping empty cart cleanup');
      return;
    }
    
    const userId = userData.user.id;
    
    // Get all active carts for this user
    const { data: carts, error: cartsError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');
      
    if (cartsError || !carts || carts.length === 0) {
      console.log('[cartCleanup] No active carts found or error fetching carts');
      return;
    }
    
    // Check each cart for items
    for (const cart of carts) {
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('id')
        .eq('cart_id', cart.id)
        .limit(1);
        
      if (itemsError) {
        console.error(`[cartCleanup] Error checking items for cart ${cart.id}:`, itemsError);
        continue;
      }
      
      // If cart has no items, archive it
      if (!items || items.length === 0) {
        console.log(`[cartCleanup] Archiving empty cart: ${cart.id}`);
        
        const { error: archiveError } = await supabase
          .from('carts')
          .update({ status: 'abandoned' }) // Changed from 'archived' to 'abandoned' to match DB constraint
          .eq('id', cart.id);
          
        if (archiveError) {
          console.error(`[cartCleanup] Error archiving empty cart ${cart.id}:`, archiveError);
        }
      }
    }
    
    console.log('[cartCleanup] Empty cart cleanup complete');
  } catch (error) {
    console.error('[cartCleanup] Error during empty cart cleanup:', error);
  }
}
