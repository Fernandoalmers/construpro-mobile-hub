
import { supabase } from "@/integrations/supabase/client";

/**
 * Archive carts that have been inactive for a specified period
 */
export async function archiveAbandonedCarts(olderThanDays: number = 7): Promise<boolean> {
  try {
    console.log(`[abandonedCarts] Archiving carts older than ${olderThanDays} days`);
    
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
      console.error('[abandonedCarts] Error finding old carts:', findError);
      return false;
    }
    
    if (!oldCarts || oldCarts.length === 0) {
      console.log('[abandonedCarts] No abandoned carts found');
      return true;
    }
    
    console.log(`[abandonedCarts] Found ${oldCarts.length} abandoned carts to archive`);
    
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
        console.error(`[abandonedCarts] Error archiving batch ${i / batchSize + 1}:`, updateError);
      } else {
        console.log(`[abandonedCarts] Successfully archived batch ${i / batchSize + 1}, ${batch.length} carts`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[abandonedCarts] Error archiving abandoned carts:', error);
    return false;
  }
}
