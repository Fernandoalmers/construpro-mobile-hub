
import { supabase } from '@/integrations/supabase/client';
import { VendorCustomer } from '../../../vendorCustomersService';

// Fetch customer information based on customer ID
export const fetchCustomerInfo = async (
  clienteId: string,
  vendorId: string
): Promise<VendorCustomer | undefined> => {
  try {
    if (!clienteId) {
      console.log('No cliente_id provided to fetchCustomerInfo');
      return undefined;
    }
    
    console.log(`Fetching customer info for cliente_id: ${clienteId}`);
    
    // Try to get from clientes_vendedor first as it might have cached information
    const { data: clienteVendedor, error: clienteError } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', clienteId)
      .maybeSingle();
      
    if (clienteVendedor && !clienteError) {
      console.log('Customer info found in clientes_vendedor');
      return {
        id: clienteVendedor.id,
        vendedor_id: vendorId,
        usuario_id: clienteVendedor.usuario_id,
        nome: clienteVendedor.nome || 'Cliente',
        email: clienteVendedor.email,
        telefone: clienteVendedor.telefone,
        total_gasto: clienteVendedor.total_gasto,
        ultimo_pedido: clienteVendedor.ultimo_pedido
      };
    }
    
    // If not found in clientes_vendedor, get from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .eq('id', clienteId)
      .single();
      
    if (profileError) {
      console.error('Error fetching customer profile:', profileError);
      return {
        id: clienteId,
        vendedor_id: vendorId,
        usuario_id: clienteId,
        nome: 'Cliente',
        email: '',
        telefone: '',
        total_gasto: 0
      };
    }
    
    return {
      id: profileData.id,
      vendedor_id: vendorId,
      usuario_id: profileData.id,
      nome: profileData.nome || 'Cliente',
      email: profileData.email || '',
      telefone: profileData.telefone || '',
      total_gasto: 0,
      ultimo_pedido: null
    };
  } catch (error) {
    console.error('Error in fetchCustomerInfo:', error);
    return {
      id: clienteId,
      vendedor_id: vendorId,
      usuario_id: clienteId,
      nome: 'Cliente',
      email: '',
      telefone: '',
      total_gasto: 0
    };
  }
};
