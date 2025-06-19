
import { supabase } from '@/integrations/supabase/client';

/**
 * Fix products that have segment name but missing segmento_id
 */
export const fixProductSegments = async () => {
  try {
    console.log('[fixProductSegments] Starting segment correction...');
    
    // Get all segments first
    const { data: segments, error: segmentsError } = await supabase
      .from('product_segments')
      .select('id, nome')
      .eq('status', 'ativo');
      
    if (segmentsError) {
      console.error('[fixProductSegments] Error fetching segments:', segmentsError);
      return;
    }
    
    console.log('[fixProductSegments] Available segments:', segments);
    
    // Get products with segment name but no segmento_id
    const { data: productsToFix, error: productsError } = await supabase
      .from('produtos')
      .select('id, nome, segmento, segmento_id')
      .not('segmento', 'is', null)
      .is('segmento_id', null);
      
    if (productsError) {
      console.error('[fixProductSegments] Error fetching products:', productsError);
      return;
    }
    
    console.log('[fixProductSegments] Products to fix:', productsToFix);
    
    // Fix each product
    for (const product of productsToFix || []) {
      const matchingSegment = segments?.find(s => 
        s.nome.toLowerCase() === product.segmento.toLowerCase()
      );
      
      if (matchingSegment) {
        console.log(`[fixProductSegments] Fixing ${product.nome} - setting segmento_id to ${matchingSegment.id}`);
        
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ segmento_id: matchingSegment.id })
          .eq('id', product.id);
          
        if (updateError) {
          console.error(`[fixProductSegments] Failed to update ${product.nome}:`, updateError);
        } else {
          console.log(`[fixProductSegments] Successfully updated ${product.nome}`);
        }
      } else {
        console.warn(`[fixProductSegments] No matching segment found for "${product.segmento}" in product ${product.nome}`);
      }
    }
    
    console.log('[fixProductSegments] Segment correction completed');
    
  } catch (error) {
    console.error('[fixProductSegments] Unexpected error:', error);
  }
};
