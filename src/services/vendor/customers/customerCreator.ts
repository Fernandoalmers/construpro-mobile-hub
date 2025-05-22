
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorCustomer } from './types';

/**
 * Adds a new customer for the vendor
 */
export const addVendorCustomer = async (customerData: Partial<VendorCustomer>): Promise<VendorCustomer | null> => {
  try {
    console.log('Adding vendor customer:', customerData);
    
    // Get the vendor ID of the current logged in user
    const authUser = await supabase.auth.getUser();
    const userId = authUser.data.user?.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      toast.error('Usuário não autenticado');
      return null;
    }
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor');
      return null;
    }
    
    // Ensure nome is present and not undefined/null
    if (!customerData.nome) {
      console.error('Customer name is required');
      toast.error('Nome do cliente é obrigatório');
      return null;
    }
    
    // Ensure usuario_id is present and not undefined/null
    if (!customerData.usuario_id) {
      console.error('Customer user ID is required');
      toast.error('ID do usuário é obrigatório');
      return null;
    }
    
    // Combine the customer data with the vendor ID
    const newCustomer = {
      ...customerData,
      nome: customerData.nome,  // Ensure nome is explicitly set
      usuario_id: customerData.usuario_id, // Ensure usuario_id is explicitly set
      vendedor_id: vendorData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the new customer
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .insert(newCustomer)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error adding vendor customer:', error);
      toast.error('Erro ao adicionar cliente');
      return null;
    }
    
    toast.success('Cliente adicionado com sucesso!');
    return data;
  } catch (error) {
    console.error('Error in addVendorCustomer:', error);
    toast.error('Erro ao adicionar cliente');
    return null;
  }
};
