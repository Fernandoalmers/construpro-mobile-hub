
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorCustomer } from './types';

/**
 * Fetches a single vendor customer by ID
 */
export const getVendorCustomer = async (customerId: string) => {
  try {
    console.log('Fetching vendor customer with ID:', customerId);
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching vendor customer:', error);
      toast.error('Erro ao buscar dados do cliente');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getVendorCustomer:', error);
    toast.error('Erro ao buscar dados do cliente');
    return null;
  }
};

/**
 * Fetches all customers for the current vendor
 */
export const getVendorCustomers = async (): Promise<VendorCustomer[]> => {
  try {
    console.log('Fetching vendor customers');
    
    // Get the vendor ID of the current logged in user
    const authUser = await supabase.auth.getUser();
    const userId = authUser.data.user?.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      toast.error('Erro ao buscar identificação do vendedor');
      return [];
    }
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor');
      return [];
    }
    
    const vendorId = vendorData.id;
    
    // Now get all customers for this vendor
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .order('nome');
    
    if (error) {
      console.error('Error fetching vendor customers:', error);
      toast.error('Erro ao buscar clientes');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getVendorCustomers:', error);
    toast.error('Erro ao buscar clientes');
    return [];
  }
};

/**
 * Searches for customers by query string
 */
export const searchCustomers = async (query: string): Promise<VendorCustomer[]> => {
  try {
    console.log('Searching customers with query:', query);
    
    // Get the vendor ID of the current logged in user
    const authUser = await supabase.auth.getUser();
    const userId = authUser.data.user?.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      toast.error('Usuário não autenticado');
      return [];
    }
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor');
      return [];
    }
    
    const vendorId = vendorData.id;
    
    // Search for customers that match the query - ONLY using fields that exist in the table
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .or(`nome.ilike.%${query}%,email.ilike.%${query}%,telefone.ilike.%${query}%`);
    
    if (error) {
      console.error('Error searching customers:', error);
      toast.error('Erro ao buscar clientes');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    toast.error('Erro ao buscar clientes');
    return [];
  }
};

/**
 * Finds a customer by email
 */
export const findCustomerByEmail = async (email: string): Promise<VendorCustomer | null> => {
  try {
    console.log('Finding customer by email:', email);
    
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
      return null;
    }
    
    const vendorId = vendorData.id;
    
    // Find the customer by email
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('Error finding customer by email:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in findCustomerByEmail:', error);
    return null;
  }
};
