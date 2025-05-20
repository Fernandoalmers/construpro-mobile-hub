
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from './vendorProfileService';
import { VendorCustomer } from './vendorCustomersService';

export interface PointAdjustment {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  tipo: string;
  valor: number;
  motivo: string;
  created_at?: string;
  cliente?: VendorCustomer;
}

// Points Adjustment Management
export const getPointAdjustments = async (userId?: string): Promise<PointAdjustment[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
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

export const createPointAdjustment = async (
  userId: string,
  tipo: string,
  valor: number,
  motivo: string
): Promise<boolean> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return false;
    }

    // Store the vendor ID in localStorage for filtering in the UI
    localStorage.setItem('vendor_profile_id', vendorProfile.id);
    
    // First, insert the points adjustment record
    const { error: insertError } = await supabase
      .from('pontos_ajustados')
      .insert({
        vendedor_id: vendorProfile.id,
        usuario_id: userId,
        tipo,
        valor,
        motivo
      });
    
    if (insertError) {
      console.error('Error creating point adjustment:', insertError);
      throw insertError;
    }
    
    // Then call the function to update the user's points
    const { error: updateError } = await supabase
      .rpc('update_user_points', {
        user_id: userId,
        points_to_add: valor
      });
      
    if (updateError) {
      console.error('Error updating user points:', updateError);
      toast.error('Erro ao atualizar pontos do usuário');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating point adjustment:', error);
    toast.error('Erro ao ajustar pontos');
    return false;
  }
};
