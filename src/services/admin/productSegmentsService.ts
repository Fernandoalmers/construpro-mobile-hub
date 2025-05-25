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
    console.log('[ProductSegmentsService] Fetching product segments with RPC');
    
    const { data, error } = await supabase.rpc('get_product_segments');
    
    if (error) {
      console.error('[ProductSegmentsService] Error fetching product segments with RPC:', error);
      toast.error('Erro ao carregar segmentos de produtos');
      return [];
    }
    
    if (!data) {
      console.log('[ProductSegmentsService] No segments data returned');
      return [];
    }
    
    console.log('[ProductSegmentsService] RPC returned data:', data);
    
    // The RPC function now returns all required fields directly
    const segments = data.map(item => ({
      id: item.id,
      nome: item.nome,
      image_url: item.image_url || null,
      status: item.status || 'ativo'
    }));
    
    console.log('[ProductSegmentsService] Processed segments:', segments);
    return segments;
  } catch (error) {
    console.error('[ProductSegmentsService] Error in getProductSegments:', error);
    toast.error('Erro ao carregar segmentos');
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
