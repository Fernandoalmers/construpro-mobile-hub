
import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the customer exists in clientes_vendedor table
 */
export const ensureCustomerExists = async (
  vendorId: string,
  userId: string,
  customerData: { nome: string, email?: string, telefone?: string }
): Promise<boolean> => {
  try {
    console.log('Ensuring customer exists:', { vendorId, userId, customerData });
    
    // Check if customer already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing customer:', checkError);
      return false;
    }
    
    if (existingCustomer) {
      console.log('Customer already exists:', existingCustomer);
      return true;
    }
    
    // Create customer if not exists
    const { error: insertError } = await supabase
      .from('clientes_vendedor')
      .insert({
        vendedor_id: vendorId,
        usuario_id: userId,
        nome: customerData.nome,
        email: customerData.email || null,
        telefone: customerData.telefone || null,
        total_gasto: 0,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error creating customer:', insertError);
      return false;
    }
    
    console.log('Customer created successfully');
    return true;
  } catch (error) {
    console.error('Error in ensureCustomerExists:', error);
    return false;
  }
};

/**
 * Searches for customers in the profiles table
 */
export const searchCustomerProfiles = async (searchTerm: string): Promise<any[]> => {
  try {
    console.log('Searching customer profiles with term:', searchTerm);
    // Search in profiles table for any user matching search criteria
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(10);
      
    if (error) {
      console.error('Error searching customer profiles:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} customer profiles`);
    return data || [];
  } catch (error) {
    console.error('Error in searchCustomerProfiles:', error);
    return [];
  }
};
