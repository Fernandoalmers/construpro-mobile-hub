
import { supabase } from '@/integrations/supabase/client';
import { VendorCustomer } from '../../../vendorCustomersService';

// Fetch customer info by ID
export const fetchCustomerInfo = async (
  customerId: string, 
  vendorId: string
): Promise<VendorCustomer> => {
  try {
    const { data: clienteData } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .eq('id', customerId)
      .maybeSingle();
    
    // Create cliente info with explicit properties
    return {
      id: customerId || '',
      vendedor_id: vendorId,
      usuario_id: customerId,
      nome: clienteData?.nome || 'Cliente',
      telefone: clienteData?.telefone || '',
      email: clienteData?.email || '',
      total_gasto: 0
    };
  } catch (error) {
    console.error('Error fetching customer info:', error);
    return {
      id: customerId || '',
      vendedor_id: vendorId,
      usuario_id: customerId,
      nome: 'Cliente',
      telefone: '',
      email: '',
      total_gasto: 0
    };
  }
};
