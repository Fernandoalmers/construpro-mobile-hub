
import { supabase } from '@/integrations/supabase/client';
import { VendorCustomer } from '../../../vendorCustomersService';

// Fetch customer information with fallback handling
export const fetchCustomerInfo = async (userId: string, vendorId: string): Promise<VendorCustomer | null> => {
  try {
    console.log(`Fetching customer info for user ${userId} and vendor ${vendorId}`);
    
    // First try looking in clientes_vendedor table
    const { data: clienteVendedor, error: clienteError } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('usuario_id', userId)
      .eq('vendedor_id', vendorId)
      .maybeSingle();
    
    if (clienteError) {
      console.error('Error fetching cliente_vendedor:', clienteError);
    } else if (clienteVendedor) {
      console.log('Found customer in clientes_vendedor');
      return clienteVendedor as VendorCustomer;
    }
    
    // Fallback to profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, avatar')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }
    
    if (!profile) {
      console.log(`No profile found for user ID ${userId}`);
      return {
        id: '',
        nome: 'Cliente não identificado',
        email: '',
        telefone: '',
        usuario_id: userId,
        vendedor_id: vendorId,
        total_gasto: 0
      };
    }
    
    console.log('Found customer info in profiles table');
    
    // Create customer from profile
    return {
      id: userId,
      usuario_id: userId,
      vendedor_id: vendorId,
      nome: profile.nome || 'Cliente',
      email: profile.email || '',
      telefone: profile.telefone || '',
      avatar: profile.avatar || null,
      total_gasto: 0
    };
  } catch (error) {
    console.error('Error in fetchCustomerInfo:', error);
    return null;
  }
};
