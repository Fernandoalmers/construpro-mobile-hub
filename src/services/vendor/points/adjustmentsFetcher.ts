
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
    
    // Use RPC function to bypass RLS if needed
    if (vendorId) {
      // Fix: Use a type assertion to handle the RPC function name
      const { data, error } = await supabase.rpc(
        'get_point_adjustments_for_vendor' as any,
        { 
          p_usuario_id: userId,
          p_vendedor_id: vendorId
        }
      );
      
      if (error) {
        console.error('Error fetching point adjustments via RPC:', error);
        toast.error('Erro ao carregar histórico de ajustes');
        return [];
      }
      
      // Fix: Add proper type checking for the returned data
      const adjustments = Array.isArray(data) ? data : [];
      console.log(`Found ${adjustments.length} point adjustments for user:`, userId);
      return adjustments as PointAdjustment[];
    } else {
      // Fallback to direct query if no vendor ID
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
      
      console.log(`Found ${data?.length || 0} point adjustments for user:`, userId);
      return data || [];
    }
  } catch (error) {
    console.error('Error in getPointAdjustments:', error);
    toast.error('Erro ao buscar histórico de ajustes de pontos');
    return [];
  }
};
