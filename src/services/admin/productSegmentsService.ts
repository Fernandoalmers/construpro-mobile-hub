
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
    
    // Handle the response data - it could be missing some fields depending on when the DB function was updated
    if (data && data.length > 0) {
      console.log('[ProductSegmentsService] RPC returned data:', data);
      
      // Check if data might be missing required fields (image_url or status)
      if (!data[0].hasOwnProperty('image_url') || !data[0].hasOwnProperty('status')) {
        // We need to fetch the complete records from the table
        const segmentIds = data.map(s => s.id);
        
        console.log('[ProductSegmentsService] RPC missing fields, fetching complete data for IDs:', segmentIds);
        
        const { data: completeData, error: completeError } = await supabase
          .from('product_segments')
          .select('id, nome, image_url, status')
          .in('id', segmentIds)
          .order('nome');
          
        if (completeError) {
          console.error('[ProductSegmentsService] Error fetching complete segment data:', completeError);
          
          // If we can't get complete data, provide default values for missing fields
          // Use explicit type assertion to make TypeScript happy
          return data.map(item => ({
            id: item.id,
            nome: item.nome,
            image_url: null,
            status: 'ativo' // Default status
          }));
        }
        
        console.log('[ProductSegmentsService] Complete data fetched successfully:', completeData);
        return completeData || [];
      }
    }
    
    // If we get here, we assume the data has all required fields
    if (data) {
      console.log('[ProductSegmentsService] Returning segments data directly from RPC');
      // Ensure all data has the required fields with proper types using type assertion
      return data.map(item => {
        // Use type assertion to tell TypeScript this object has the properties we expect
        const typedItem = item as { id: string; nome: string; image_url?: string | null; status?: string };
        return {
          id: typedItem.id,
          nome: typedItem.nome,
          image_url: typedItem.image_url || null,
          status: typedItem.status || 'ativo'
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

// Upload image to segment-images bucket
export const uploadSegmentImage = async (file: File): Promise<string | null> => {
  try {
    console.log('[ProductSegmentsService] Starting image upload:', file.name);
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('[ProductSegmentsService] Uploading to:', fileName);
    
    const { data, error } = await supabase.storage
      .from('segment-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('[ProductSegmentsService] Upload error:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
    
    console.log('[ProductSegmentsService] Upload successful:', data);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('segment-images')
      .getPublicUrl(fileName);
    
    console.log('[ProductSegmentsService] Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[ProductSegmentsService] Error in uploadSegmentImage:', error);
    toast.error('Erro ao fazer upload da imagem');
    return null;
  }
};

// Delete image from segment-images bucket
export const deleteSegmentImage = async (imageUrl: string): Promise<boolean> => {
  try {
    if (!imageUrl) return true;
    
    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    console.log('[ProductSegmentsService] Deleting image:', fileName);
    
    const { error } = await supabase.storage
      .from('segment-images')
      .remove([fileName]);
    
    if (error) {
      console.error('[ProductSegmentsService] Delete error:', error);
      return false;
    }
    
    console.log('[ProductSegmentsService] Image deleted successfully');
    return true;
  } catch (error) {
    console.error('[ProductSegmentsService] Error in deleteSegmentImage:', error);
    return false;
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
