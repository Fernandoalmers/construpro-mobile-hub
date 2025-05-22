
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
    
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      toast.error('Perfil de vendedor não encontrado');
      return false;
    }

    console.log('Creating point adjustment for user:', userId, 'by vendor:', vendorProfile.id);
    
    // Store the vendor ID in localStorage for filtering in the UI
    localStorage.setItem('vendor_profile_id', vendorProfile.id);
    
    // Get customer profile data - using maybeSingle instead of single to prevent errors
    const { data: customerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
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
        telefone: customerProfile.telefone
      }
    );
    
    if (!customerCreated) {
      console.warn('Could not create/verify customer relationship, but will continue with point adjustment');
    }
    
    // Calculate the actual value based on tipo
    // If removing points (remocao), we need to store a negative value
    const adjustmentValue = tipo === 'remocao' ? -Math.abs(valor) : Math.abs(valor);
    
    console.log('Preparing to insert point adjustment with value:', adjustmentValue);
    
    // Insert the points adjustment record
    // The database triggers we created will handle:
    // 1. Updating the user's points balance via update_points_on_adjustment trigger
    // 2. Creating a transaction record via register_transaction_after_adjustment trigger
    const { data: insertedData, error: insertError } = await supabase
      .from('pontos_ajustados')
      .insert({
        vendedor_id: vendorProfile.id,
        usuario_id: userId,
        tipo,
        valor: adjustmentValue,  // Store as positive for adicao, negative for remocao
        motivo
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error('Error creating point adjustment:', insertError);
      toast.error('Erro ao ajustar pontos: ' + insertError.message);
      return false;
    }
    
    console.log('Point adjustment created successfully:', insertedData);
    return true;
  } catch (error) {
    console.error('Error creating point adjustment:', error);
    toast.error('Erro ao ajustar pontos. Verifique o console para detalhes.');
    return false;
  }
};
