
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '../../vendorProfileService';
import { VendorCustomer } from '../../vendorCustomersService';
import { PointAdjustment } from './types';

/**
 * Fetches point adjustments for a specific vendor, optionally filtered by user
 */
export const getPointAdjustments = async (userId?: string): Promise<PointAdjustment[]> => {
  try {
    console.log('Fetching point adjustments for user ID:', userId || 'all');
    
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    console.log('Fetching point adjustments for vendor:', vendorProfile.id, 'and user:', userId || 'all users');
    
    let query = supabase
      .from('pontos_ajustados')
      .select(`
        *,
        cliente:usuario_id (
          id,
          nome,
          email,
          telefone
        )
      `)
      .eq('vendedor_id', vendorProfile.id);
    
    if (userId) {
      query = query.eq('usuario_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching point adjustments:', error);
      return [];
    }

    console.log('Point adjustments found:', data?.length || 0, data);

    // Create safe adjustments with proper cliente handling
    const safeAdjustments = data.map(item => {
      // Create a cliente object safely
      const clienteData = item.cliente as any;
      const clienteInfo: VendorCustomer = {
        id: item.usuario_id || '',
        vendedor_id: vendorProfile.id,
        usuario_id: item.usuario_id,
        nome: clienteData && clienteData.nome ? clienteData.nome : 'Cliente',
        telefone: clienteData && clienteData.telefone ? clienteData.telefone : '',
        email: clienteData && clienteData.email ? clienteData.email : '',
        total_gasto: 0
      };
      
      return {
        ...item,
        cliente: clienteInfo
      };
    });
    
    return safeAdjustments as PointAdjustment[];
  } catch (error) {
    console.error('Error in getPointAdjustments:', error);
    return [];
  }
};
