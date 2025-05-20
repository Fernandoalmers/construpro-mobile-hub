
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from './vendorProfileService';

export interface VendorCustomer {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  nome: string;
  telefone?: string;
  email?: string;
  ultimo_pedido?: string;
  total_gasto: number;
  created_at?: string;
  updated_at?: string;
  avatar?: string | null;
}

// Helper function to validate UUID format
const isValidUUID = (str: string): boolean => {
  // UUID regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};

// Vendor Customers Management
export const getVendorCustomers = async (): Promise<VendorCustomer[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    console.log('Fetching customers for vendor:', vendorProfile.id);
    
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .order('total_gasto', { ascending: false });
    
    if (error) {
      console.error('Error fetching vendor customers:', error);
      return [];
    }
    
    console.log(`Found ${data.length} customers for vendor ${vendorProfile.id}`);
    return data as VendorCustomer[];
  } catch (error) {
    console.error('Error in getVendorCustomers:', error);
    return [];
  }
};

export const getVendorCustomer = async (userId: string): Promise<VendorCustomer | null> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return null;
    }
    
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .eq('usuario_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
    
    return data as VendorCustomer;
  } catch (error) {
    console.error('Error in getVendorCustomer:', error);
    return null;
  }
};

// Search for customers by name, email, or phone
export const searchCustomers = async (searchTerm: string): Promise<any[]> => {
  try {
    // If search term is too short, don't search
    if (searchTerm.length < 3) {
      console.log('Search term too short, minimum 3 characters required');
      return [];
    }
    
    console.log('Searching profiles with term:', searchTerm);
    
    // Get vendor id for future filtering if needed
    const vendorProfile = await getVendorProfile();
    if (vendorProfile) {
      localStorage.setItem('vendor_profile_id', vendorProfile.id);
    }
    
    // Check if it's a specific UUID format
    if (isValidUUID(searchTerm)) {
      console.log('Searching for specific user ID:', searchTerm);
      const { data: specificUser, error: specificError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .eq('id', searchTerm)
        .limit(1);
        
      if (!specificError && specificUser && specificUser.length > 0) {
        console.log('Found specific user by ID:', specificUser);
        return specificUser;
      }
    }
    
    // Special handling for email format
    if (searchTerm.includes('@')) {
      console.log('Searching by email:', searchTerm);
      const { data: emailUsers, error: emailError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .ilike('email', `%${searchTerm}%`)
        .limit(10);
        
      if (!emailError && emailUsers && emailUsers.length > 0) {
        console.log('Found users by email:', emailUsers);
        return emailUsers;
      }
    }
    
    // Otherwise search by text terms (name, email, phone, cpf)
    console.log('Performing general text search for:', searchTerm);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(10);
    
    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }
    
    console.log(`Search found ${data?.length || 0} results`);
    return data || [];
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return [];
  }
};

// Fetch customer points
export const getCustomerPoints = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('saldo_pontos')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching customer points:', error);
      return 0;
    }
    
    console.log('Customer points:', data?.saldo_pontos || 0);
    return data?.saldo_pontos || 0;
  } catch (error) {
    console.error('Error in getCustomerPoints:', error);
    return 0;
  }
};
