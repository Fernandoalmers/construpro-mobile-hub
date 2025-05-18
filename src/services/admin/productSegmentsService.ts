
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface ProductSegment {
  id: string;
  nome: string;
}

export const getProductSegments = async (): Promise<ProductSegment[]> => {
  try {
    const { data, error } = await supabase.rpc('get_product_segments');
    
    if (error) {
      console.error('Error fetching product segments:', error);
      toast.error('Erro ao carregar segmentos de produtos');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getProductSegments:', error);
    return [];
  }
};
