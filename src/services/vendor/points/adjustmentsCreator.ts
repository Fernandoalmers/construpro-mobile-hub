
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '../../vendorProfileService';
import { ensureCustomerExists } from './customerManager';

/**
 * Creates a point adjustment for a user and updates their balance
 */
export const createPointAdjustment = async (
  userId: string,
  tipo: string,
  valor: number,
  motivo: string
): Promise<boolean> => {
  try {
    console.log('Creating point adjustment with params:', { userId, tipo, valor, motivo });
    
    // Get vendor profile - using stored ID first if available
    const storedVendorId = localStorage.getItem('vendor_profile_id');
    let vendorProfile;
    
    if (storedVendorId) {
      console.log('Using stored vendor ID:', storedVendorId);
      // Verify the stored ID is still valid
      const { data: vendorCheck, error: vendorCheckError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .eq('id', storedVendorId)
        .maybeSingle();
        
      if (vendorCheckError) {
        console.warn('Error verifying stored vendor ID:', vendorCheckError);
      }
      
      if (vendorCheck) {
        vendorProfile = vendorCheck;
        console.log('Verified vendor from stored ID:', vendorProfile.nome_loja);
      } else {
        console.log('Stored vendor ID not valid, fetching current profile');
        vendorProfile = await getVendorProfile();
      }
    } else {
      vendorProfile = await getVendorProfile();
    }
    
    if (!vendorProfile || !vendorProfile.id) {
      console.error('Vendor profile not found or incomplete:', vendorProfile);
      toast.error('Perfil de vendedor não encontrado. Por favor, faça login novamente.');
      return false;
    }

    console.log('Creating point adjustment for user:', userId, 'by vendor:', vendorProfile.id);
    
    // Store the vendor ID in localStorage for filtering in the UI and future operations
    localStorage.setItem('vendor_profile_id', vendorProfile.id);
    
    // Get customer profile data - using maybeSingle instead of single to prevent errors
    const { data: customerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching customer profile:', profileError);
      toast.error('Erro ao buscar dados do cliente');
      return false;
    }
    
    if (!customerProfile) {
      console.error('Customer profile not found for ID:', userId);
      toast.error('Perfil de cliente não encontrado');
      return false;
    }
    
    console.log('Found customer profile:', customerProfile);
    
    // Ensure the customer exists in the vendor's customer list
    const customerCreated = await ensureCustomerExists(
      vendorProfile.id,
      userId,
      {
        nome: customerProfile.nome || 'Cliente',
        email: customerProfile.email,
        telefone: customerProfile.telefone,
        cpf: customerProfile.cpf
      }
    );
    
    if (!customerCreated) {
      console.warn('Could not create/verify customer relationship, but will continue with point adjustment');
    }
    
    // Calculate the actual value based on tipo
    // If removing points (remocao), we need to store a negative value
    const adjustmentValue = tipo === 'remocao' ? -Math.abs(valor) : Math.abs(valor);
    
    console.log('Preparing to insert point adjustment with value:', adjustmentValue);
    
    // Get current user's session for RPC call 
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      console.error('No active session found');
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      return false;
    }

    // Use RPC function to bypass RLS policy issues
    // Fix: Use a type assertion to handle the RPC function name type
    const { data: insertedData, error: insertError } = await supabase.rpc(
      'create_point_adjustment' as any,
      {
        p_vendedor_id: vendorProfile.id,
        p_usuario_id: userId,
        p_tipo: tipo,
        p_valor: adjustmentValue,
        p_motivo: motivo
      }
    );
    
    if (insertError) {
      console.error('Error creating point adjustment:', insertError);
      toast.error('Erro ao ajustar pontos: ' + insertError.message);
      return false;
    }
    
    console.log('Point adjustment created successfully:', insertedData);
    toast.success('Ajuste de pontos realizado com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error creating point adjustment:', error);
    toast.error(`Erro ao ajustar pontos: ${error?.message || 'Verifique o console para detalhes'}`);
    return false;
  }
};
