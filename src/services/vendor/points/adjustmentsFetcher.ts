
import { supabase } from '@/integrations/supabase/client';
import { PointAdjustment } from './types';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches point adjustment history for a specific customer
 */
export const getPointAdjustments = async (userId: string): Promise<PointAdjustment[]> => {
  try {
    console.log('Fetching point adjustments for user:', userId);
    
    // Optional: If we have a stored vendor ID, use it to filter the results
    const vendorId = localStorage.getItem('vendor_profile_id');
    
    // Use a direct query to get point adjustments
    let { data, error } = await supabase
      .from('pontos_ajustados')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching point adjustments:', error);
      toast.error('Erro ao carregar histórico de ajustes');
      return [];
    }
    
    // Filter by vendor ID if available
    if (vendorId && Array.isArray(data)) {
      data = data.filter(item => item.vendedor_id === vendorId);
    }
    
    console.log(`Found ${data?.length || 0} point adjustments for user:`, userId);
    return data as PointAdjustment[] || [];
  } catch (error) {
    console.error('Error in getPointAdjustments:', error);
    toast.error('Erro ao buscar histórico de ajustes de pontos');
    return [];
  }
};
