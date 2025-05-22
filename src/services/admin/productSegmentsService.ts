
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface ProductSegment {
  id: string;
  nome: string;
  image_url?: string | null;
  status: string;
}

export const getProductSegments = async (): Promise<ProductSegment[]> => {
  try {
    console.log('[ProductSegmentsService] Fetching product segments');
    
    // Using the database function is more reliable than directly querying
    const { data, error } = await supabase.rpc('get_product_segments');
    
    if (error) {
      console.error('[ProductSegmentsService] Error fetching product segments with RPC:', error);
      toast.error('Erro ao carregar segmentos de produtos');
      
      // Fallback to direct query if the RPC function fails
      console.log('[ProductSegmentsService] Trying direct query fallback');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('product_segments')
        .select('id, nome, image_url, status')
        .order('nome');
        
      if (fallbackError) {
        console.error('[ProductSegmentsService] Fallback error fetching product segments:', fallbackError);
        return [];
      }
      
      console.log('[ProductSegmentsService] Fallback query successful, segments:', fallbackData);
      return fallbackData || [];
    }
    
    // Handle the case where the RPC function returns only id and nome (without status and image_url)
    if (data && data.length > 0) {
      console.log('[ProductSegmentsService] RPC returned data:', data);
      
      // Check if data lacks the required status field
      if (!('status' in data[0]) || !('image_url' in data[0])) {
        console.log('[ProductSegmentsService] RPC data missing fields, fetching complete data');
        const segmentIds = data.map(s => s.id);
        
        const { data: completeData, error: completeError } = await supabase
          .from('product_segments')
          .select('id, nome, image_url, status')
          .in('id', segmentIds)
          .order('nome');
          
        if (completeError) {
          console.error('[ProductSegmentsService] Error fetching complete segment data:', completeError);
          // If we can't get complete data, provide default status for each item
          return data.map(item => ({
            ...item,
            status: 'ativo', // Default status
            image_url: null  // Default image_url
          }));
        }
        
        console.log('[ProductSegmentsService] Complete data fetched successfully:', completeData);
        return completeData || [];
      }
    }
    
    // Ensure any data returned has the required status property
    if (data) {
      console.log('[ProductSegmentsService] Returning normalized segments data');
      // Since TypeScript doesn't know the exact shape of data here,
      // we need to type-check each item or cast it appropriately
      return data.map(item => {
        const segment = item as Partial<ProductSegment>;
        return {
          id: segment.id!,
          nome: segment.nome!,
          image_url: segment.image_url || null,
          status: segment.status || 'ativo' // Set default status if missing
        };
      });
    }
    
    console.log('[ProductSegmentsService] No segments data returned');
    return [];
  } catch (error) {
    console.error('[ProductSegmentsService] Error in getProductSegments:', error);
    return [];
  }
};

// Add a function to check if the storage bucket exists
export const checkSegmentImageBucket = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .storage
      .getBucket('segment-images');
    
    if (error) {
      console.error('[ProductSegmentsService] Error checking segment-images bucket:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('[ProductSegmentsService] Error in checkSegmentImageBucket:', error);
    return false;
  }
};

// Add a function to list segment images for debugging
export const listSegmentImages = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .storage
      .from('segment-images')
      .list();
    
    if (error) {
      console.error('[ProductSegmentsService] Error listing segment images:', error);
      return [];
    }
    
    return (data || []).map(file => file.name);
  } catch (error) {
    console.error('[ProductSegmentsService] Error in listSegmentImages:', error);
    return [];
  }
};
