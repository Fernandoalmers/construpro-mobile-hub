
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
    
    // Insert the point adjustment record
    const { data: insertData, error: insertError } = await supabase
      .from('pontos_ajustados')
      .insert({
        vendedor_id: vendorProfile.id,
        usuario_id: userId,
        tipo: tipo,
        valor: adjustmentValue,
        motivo: motivo
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error('Error creating point adjustment:', insertError);
      toast.error('Erro ao ajustar pontos: ' + insertError.message);
      return false;
    }
    
    // Now handle the points transaction entry manually since the trigger might be causing issues
    // Map our adjustment types to valid points_transactions tipos
    const transactionTipo = tipo === 'adicao' ? 'compra' : 'resgate';
    
    const { error: transactionError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        pontos: adjustmentValue,  // Use the same value (positive or negative)
        tipo: transactionTipo,    // Using valid transaction types
        descricao: `Ajuste de pontos: ${motivo}`,
        referencia_id: insertData.id
      });
      
    if (transactionError) {
      console.error('Error creating points transaction record:', transactionError);
      toast.error('Pontos ajustados, mas houve um erro ao registrar a transação');
      // We don't fail the whole operation if just the transaction record fails
    }
    
    // Update the user's points balance directly
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        saldo_pontos: supabase.rpc('adjust_user_points', { 
          user_id: userId, 
          points_to_add: adjustmentValue 
        })
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user points balance:', updateError);
      toast.error('Erro ao atualizar saldo de pontos do cliente');
      return false;
    }
    
    console.log('Point adjustment created successfully:', insertData);
    toast.success('Ajuste de pontos realizado com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error creating point adjustment:', error);
    toast.error(`Erro ao ajustar pontos: ${error?.message || 'Verifique o console para detalhes'}`);
    return false;
  }
};
