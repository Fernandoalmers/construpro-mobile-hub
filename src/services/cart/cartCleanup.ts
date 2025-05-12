
import { supabase } from "@/integrations/supabase/client";

/**
 * Archive carts that have been inactive for a specified period
 */
export async function archiveAbandonedCarts(olderThanDays: number = 30): Promise<boolean> {
  try {
    console.log(`[cartCleanup] Archiving carts older than ${olderThanDays} days`);
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Find active carts older than the cutoff date
    const { data: oldCarts, error: findError } = await supabase
      .from('carts')
      .select('id')
      .eq('status', 'active')
      .lt('updated_at', cutoffDate.toISOString())
      .limit(500); // Limit to avoid processing too many at once
      
    if (findError) {
      console.error('[cartCleanup] Error finding old carts:', findError);
      return false;
    }
    
    if (!oldCarts || oldCarts.length === 0) {
      console.log('[cartCleanup] No abandoned carts found');
      return true;
    }
    
    console.log(`[cartCleanup] Found ${oldCarts.length} abandoned carts to archive`);
    
    // Archive in batches to avoid query size limitations
    const batchSize = 100;
    const cartIds = oldCarts.map(cart => cart.id);
    
    for (let i = 0; i < cartIds.length; i += batchSize) {
      const batch = cartIds.slice(i, i + batchSize);
      
      const { error: updateError } = await supabase
        .from('carts')
        .update({ status: 'archived' })
        .in('id', batch);
        
      if (updateError) {
        console.error(`[cartCleanup] Error archiving batch ${i / batchSize + 1}:`, updateError);
      } else {
        console.log(`[cartCleanup] Successfully archived batch ${i / batchSize + 1}, ${batch.length} carts`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[cartCleanup] Error archiving abandoned carts:', error);
    return false;
  }
}
