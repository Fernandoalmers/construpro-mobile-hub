
import { supabase } from '@/integrations/supabase/client';
import { setupAndMigrateCustomerData } from './vendor/utils/migrateHelper';

export interface VendorCustomer {
  id: string;
  usuario_id: string;
  vendedor_id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string; // Add cpf property
  ultimo_pedido?: string;
  total_gasto: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all customers for the current vendor
 */
export const getVendorCustomers = async (): Promise<VendorCustomer[]> => {
  try {
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      return [];
    }
    
    const vendorId = vendorData;
    
    // Get customers for this vendor
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId);
      
    if (error) {
      console.error('Error fetching vendor customers:', error);
      return [];
    }
    
    return data as VendorCustomer[];
  } catch (error) {
    console.error('Error in getVendorCustomers:', error);
    return [];
  }
};

/**
 * Fetches a specific customer for the current vendor
 */
export const getVendorCustomer = async (userId: string): Promise<VendorCustomer | null> => {
  try {
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      return null;
    }
    
    const vendorId = vendorData;
    
    // Get customer for this vendor
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching vendor customer:', error);
      return null;
    }
    
    return data as VendorCustomer;
  } catch (error) {
    console.error('Error in getVendorCustomer:', error);
    return null;
  }
};

/**
 * Searches for customers by name, email, or phone
 */
export const searchCustomers = async (searchTerm: string): Promise<VendorCustomer[]> => {
  try {
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError) {
      console.error('Error fetching vendor ID:', vendorError);
      return [];
    }
    
    const vendorId = vendorData;
    
    if (!vendorId) {
      console.error('No vendor ID found. User may not be a vendor.');
      
      // Fallback approach: Search profiles directly if vendor ID is not available
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
        .limit(10);
        
      if (profilesError) {
        console.error('Error searching profiles:', profilesError);
        return [];
      }
      
      // Convert profiles to VendorCustomer format
      return (profiles || []).map(profile => ({
        id: profile.id,
        usuario_id: profile.id,
        vendedor_id: vendorId || '',
        nome: profile.nome || 'Usuário',
        email: profile.email,
        telefone: profile.telefone,
        cpf: profile.cpf, // Include cpf
        total_gasto: 0
      }));
    }
    
    console.log('Searching for customers with vendor ID:', vendorId);
    console.log('Search term:', searchTerm);
    
    // Search for customers first in the clientes_vendedor table
    const { data: existingCustomers, error: existingError } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`)
      .limit(10);
      
    if (existingError) {
      console.error('Error searching existing customers:', existingError);
      return [];
    }
    
    if (existingCustomers && existingCustomers.length > 0) {
      console.log('Found existing customers:', existingCustomers.length);
      return existingCustomers as VendorCustomer[];
    }
    
    // If no customers found in vendor's list, search in profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .limit(10);
      
    if (profilesError) {
      console.error('Error searching profiles:', profilesError);
      return [];
    }
    
    console.log('Found profiles:', profiles?.length || 0);
    
    // Convert profiles to VendorCustomer format
    return (profiles || []).map(profile => ({
      id: profile.id,
      usuario_id: profile.id,
      vendedor_id: vendorId,
      nome: profile.nome || 'Usuário',
      email: profile.email,
      telefone: profile.telefone,
      total_gasto: 0,
      cpf: profile.cpf // Include cpf
    }));
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return [];
  }
};

/**
 * Gets a customer's points by user ID
 */
export const getCustomerPoints = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('saldo_pontos')
      .eq('id', userId)
      .maybeSingle();
      
    if (error || !data) {
      console.error('Error fetching customer points:', error);
      return 0;
    }
    
    return data.saldo_pontos || 0;
  } catch (error) {
    console.error('Error in getCustomerPoints:', error);
    return 0;
  }
};

/**
 * Adds a customer to the vendor's customer list
 */
export const addVendorCustomer = async (
  email: string, 
  name: string, 
  phone?: string
): Promise<boolean> => {
  try {
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      return false;
    }
    
    const vendorId = vendorData;
    
    // First check if user exists in profiles
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .eq('email', email.toLowerCase())
      .maybeSingle();
      
    if (userError) {
      console.error('Error checking if user exists:', userError);
      return false;
    }
    
    if (!userData) {
      console.log('User with email not found:', email);
      return false;
    }
    
    // Check if customer already exists for this vendor
    const { data: existingCustomer, error: existingError } = await supabase
      .from('clientes_vendedor')
      .select('id')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', userData.id)
      .maybeSingle();
      
    if (existingError) {
      console.error('Error checking existing customer:', existingError);
      return false;
    }
    
    if (existingCustomer) {
      console.log('Customer already exists for this vendor');
      return true; // Customer already exists, consider this a success
    }
    
    // Add customer to vendor's list
    const { error: insertError } = await supabase
      .from('clientes_vendedor')
      .insert({
        vendedor_id: vendorId,
        usuario_id: userData.id,
        nome: userData.nome || name,
        email: userData.email || email,
        telefone: userData.telefone || phone,
        total_gasto: 0
      });
      
    if (insertError) {
      console.error('Error adding customer to vendor:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in addVendorCustomer:', error);
    return false;
  }
};

/**
 * Find a customer by email and add them to vendor's customer list if found
 */
export const findCustomerByEmail = async (email: string): Promise<VendorCustomer | null> => {
  try {
    // First check if user exists in profiles
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .eq('email', email.toLowerCase())
      .maybeSingle();
      
    if (userError) {
      console.error('Error checking if user exists:', userError);
      return null;
    }
    
    if (!userData) {
      console.log('User with email not found:', email);
      return null;
    }
    
    // Add the customer to vendor's list
    const success = await addVendorCustomer(userData.email, userData.nome, userData.telefone);
    
    if (!success) {
      console.error('Failed to add customer to vendor');
      return null;
    }
    
    // Get the newly added customer
    return await getVendorCustomer(userData.id);
  } catch (error) {
    console.error('Error in findCustomerByEmail:', error);
    return null;
  }
};

/**
 * Migrates customers from point adjustments
 */
export const migrateCustomersFromPointAdjustments = async (): Promise<boolean> => {
  try {
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      return false;
    }
    
    const vendorId = vendorData;
    
    // Get all unique customers from point adjustments
    const { data: adjustments, error: adjustmentsError } = await supabase
      .from('pontos_ajustados')
      .select('usuario_id')
      .eq('vendedor_id', vendorId)
      .order('created_at', { ascending: false });
      
    if (adjustmentsError) {
      console.error('Error fetching point adjustments:', adjustmentsError);
      return false;
    }
    
    if (!adjustments || adjustments.length === 0) {
      console.log('No point adjustments found for this vendor');
      return false;
    }
    
    // Get unique user IDs
    const uniqueUserIds = [...new Set(adjustments.map(a => a.usuario_id))];
    
    // Get user data for these users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .in('id', uniqueUserIds);
      
    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return false;
    }
    
    // Create a batch insert for all customers
    const customerInserts = users.map(user => ({
      vendedor_id: vendorId,
      usuario_id: user.id,
      nome: user.nome || 'Cliente sem nome',
      email: user.email,
      telefone: user.telefone,
      total_gasto: 0 // Default value, we don't know purchase history from point adjustments
    }));
    
    // Insert all customers, ignore conflicts
    const { error: insertError } = await supabase
      .from('clientes_vendedor')
      .upsert(customerInserts, { 
        onConflict: 'vendedor_id,usuario_id',
        ignoreDuplicates: true
      });
      
    if (insertError) {
      console.error('Error inserting customers:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in migrateCustomersFromPointAdjustments:', error);
    return false;
  }
};

/**
 * Creates test customers for development purposes
 */
export const seedTestCustomers = async (count: number = 5): Promise<boolean> => {
  try {
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      return false;
    }
    
    const vendorId = vendorData;
    
    // Create test customers
    const customers = [];
    for (let i = 1; i <= count; i++) {
      customers.push({
        vendedor_id: vendorId,
        usuario_id: crypto.randomUUID(),
        nome: `Cliente Teste ${i}`,
        email: `teste${i}@example.com`,
        telefone: `9${Math.floor(10000000 + Math.random() * 90000000)}`,
        total_gasto: Math.floor(Math.random() * 10000) / 100,
        ultimo_pedido: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // Insert customers
    const { error: insertError } = await supabase
      .from('clientes_vendedor')
      .insert(customers);
      
    if (insertError) {
      console.error('Error inserting test customers:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in seedTestCustomers:', error);
    return false;
  }
};

/**
 * Migrates customers from orders using the trigger function in the database
 */
export const migrateCustomersFromOrders = async (): Promise<boolean> => {
  try {
    // Call our helper function from migrateHelper.ts
    const result = await setupAndMigrateCustomerData();
    return result.success;
  } catch (error) {
    console.error('Error in migrateCustomersFromOrders:', error);
    return false;
  }
};
