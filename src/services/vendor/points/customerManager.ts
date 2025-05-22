
import { supabase } from '@/integrations/supabase/client';

/**
 * Customer data interface
 */
interface CustomerData {
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
}

/**
 * Ensures a customer exists in the vendor's customer list
 */
export const ensureCustomerExists = async (
  vendorId: string,
  userId: string,
  customerData: CustomerData
): Promise<boolean> => {
  try {
    console.log('Ensuring customer exists:', { vendorId, userId, customerData });
    
    // Check if customer already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('clientes_vendedor')
      .select('id')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking if customer exists:', checkError);
      return false;
    }
    
    if (existingCustomer) {
      console.log('Customer already exists, updating data');
      
      // Update customer data
      const { error: updateError } = await supabase
        .from('clientes_vendedor')
        .update({
          nome: customerData.nome,
          email: customerData.email,
          telefone: customerData.telefone,
          updated_at: new Date().toISOString()
        })
        .eq('vendedor_id', vendorId)
        .eq('usuario_id', userId);
        
      if (updateError) {
        console.error('Error updating customer:', updateError);
        return false;
      }
      
      return true;
    }
    
    // Customer doesn't exist, create new record
    console.log('Customer does not exist, creating new record');
    const { error: insertError } = await supabase
      .from('clientes_vendedor')
      .insert({
        vendedor_id: vendorId,
        usuario_id: userId,
        nome: customerData.nome,
        email: customerData.email,
        telefone: customerData.telefone,
        total_gasto: 0
      });
      
    if (insertError) {
      console.error('Error creating customer:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureCustomerExists:', error);
    return false;
  }
};

/**
 * Search for customer profiles in the general users pool
 */
export const searchCustomerProfiles = async (searchTerm: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(10);
      
    if (error) {
      console.error('Error searching customer profiles:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchCustomerProfiles:', error);
    return [];
  }
};
