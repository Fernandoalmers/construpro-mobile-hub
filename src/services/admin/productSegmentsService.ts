
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
    // Using the database function is more reliable than directly querying
    const { data, error } = await supabase.rpc('get_product_segments');
    
    if (error) {
      console.error('Error fetching product segments:', error);
      toast.error('Erro ao carregar segmentos de produtos');
      
      // Fallback to direct query if the RPC function fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('product_segments')
        .select('id, nome, image_url, status')
        .order('nome');
        
      if (fallbackError) {
        console.error('Fallback error fetching product segments:', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }
    
    // Handle the case where the RPC function returns only id and nome (without status and image_url)
    if (data && data.length > 0) {
      // Check if data lacks the required status field
      if (!('status' in data[0])) {
        const segmentIds = data.map(s => s.id);
        
        const { data: completeData, error: completeError } = await supabase
          .from('product_segments')
          .select('id, nome, image_url, status')
          .in('id', segmentIds)
          .order('nome');
          
        if (completeError) {
          console.error('Error fetching complete segment data:', completeError);
          // If we can't get complete data, provide default status for each item
          return data.map(item => ({
            ...item,
            status: 'ativo', // Default status
            image_url: null  // Default image_url
          }));
        }
        
        return completeData || [];
      }
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getProductSegments:', error);
    return [];
  }
};
