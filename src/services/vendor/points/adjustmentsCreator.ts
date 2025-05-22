
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
    
    // IMPROVED: Log exactly what ID we're using before the profile lookup
    console.log('Looking up customer profile with EXACT user ID:', userId);
    
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
    
    // IMPROVED: More detailed logging about the profile lookup results
    console.log('Customer profile lookup result:', customerProfile ? 'Found' : 'Not found');
    
    if (!customerProfile) {
      // IMPROVED: Do another lookup to check if this ID exists in a different format or table
      console.error('Customer profile not found for ID:', userId);
      
      // Try a debug query to see if this ID exists in relacionamento cliente_vendedor
      const { data: debugClienteVendedor } = await supabase
        .from('clientes_vendedor')
        .select('id, usuario_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (debugClienteVendedor) {
        console.error('CRITICAL ERROR: The ID provided matches a cliente_vendedor relation ID, not a user ID!');
        console.error('Found relation:', debugClienteVendedor);
        console.error('Should be using usuario_id:', debugClienteVendedor.usuario_id);
        toast.error('Erro: ID de relacionamento sendo usado no lugar de ID de usuário');
      } else {
        // Try a more general search to see if the user exists at all
        const { data: anyUserMatches } = await supabase
          .from('profiles')
          .select('id')
          .limit(5);
          
        console.error('Could not find user with ID:', userId);
        console.error('Sample of existing users:', anyUserMatches);
        toast.error('Perfil de cliente não encontrado. Verifique o ID do usuário.');
      }
      
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
    
    console.log('Point adjustment created successfully:', insertData);
    toast.success('Ajuste de pontos realizado com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error creating point adjustment:', error);
    toast.error(`Erro ao ajustar pontos: ${error?.message || 'Verifique o console para detalhes'}`);
    return false;
  }
};
