
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from './vendorProfileService';
import { toast } from '@/components/ui/sonner';

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
    
    // Log the actual data received from the database
    console.log(`Found ${data?.length || 0} customers for vendor ${vendorProfile.id}:`, data);
    
    // If no data, try to check if the table exists and has data
    if (!data || data.length === 0) {
      // Check if the table has any data at all
      const { count, error: countError } = await supabase
        .from('clientes_vendedor')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error checking clientes_vendedor table:', countError);
      } else {
        console.log(`clientes_vendedor table has ${count} total records`);
      }
    }
    
    return data as VendorCustomer[] || [];
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
    
    // Get vendor id for filtering out the vendor from search results
    const vendorProfile = await getVendorProfile();
    let vendorId = '';
    if (vendorProfile) {
      vendorId = vendorProfile.id;
      localStorage.setItem('vendor_profile_id', vendorId);
    } else {
      console.warn('Vendor profile not found, search might include all users');
    }
    
    // Get vendor user ID to exclude from search results
    const { data: vendorData } = await supabase
      .from('vendedores')
      .select('usuario_id')
      .eq('id', vendorId)
      .maybeSingle();
    
    const vendorUserId = vendorData?.usuario_id;
    console.log('Excluding vendor user ID from search:', vendorUserId);
    
    // Check if it's a specific UUID format
    if (isValidUUID(searchTerm)) {
      console.log('Searching for specific user ID:', searchTerm);
      const { data: specificUser, error: specificError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .eq('id', searchTerm)
        .neq('id', vendorUserId || '')  // Exclude vendor, with safe fallback
        .limit(1);
        
      if (!specificError && specificUser && specificUser.length > 0) {
        console.log('Found specific user by ID:', specificUser);
        return specificUser;
      }
    }
    
    // Special handling for CPF format (remove any non-numeric characters)
    const cleanedSearchTerm = searchTerm.replace(/\D/g, '');
    if (cleanedSearchTerm.length >= 9) {
      console.log('Searching by cleaned CPF:', cleanedSearchTerm);
      const { data: cpfUsers, error: cpfError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .ilike('cpf', `%${cleanedSearchTerm}%`)
        .neq('id', vendorUserId || '')  // Exclude vendor
        .limit(10);
        
      if (!cpfError && cpfUsers && cpfUsers.length > 0) {
        console.log('Found users by CPF:', cpfUsers);
        return cpfUsers;
      }
    }
    
    // Special handling for email format
    if (searchTerm.includes('@')) {
      console.log('Searching by email:', searchTerm);
      const { data: emailUsers, error: emailError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, cpf')
        .ilike('email', `%${searchTerm}%`)
        .neq('id', vendorUserId || '')  // Exclude vendor
        .limit(10);
        
      if (!emailError && emailUsers && emailUsers.length > 0) {
        console.log('Found users by email:', emailUsers);
        return emailUsers;
      }
    }
    
    // Search by phone number (remove formatting)
    if (/\d/.test(searchTerm)) {
      const phoneSearchTerm = searchTerm.replace(/\D/g, '');
      if (phoneSearchTerm.length >= 8) {
        console.log('Searching by phone:', phoneSearchTerm);
        const { data: phoneUsers, error: phoneError } = await supabase
          .from('profiles')
          .select('id, nome, email, telefone, cpf')
          .ilike('telefone', `%${phoneSearchTerm}%`)
          .neq('id', vendorUserId || '')  // Exclude vendor
          .limit(10);
          
        if (!phoneError && phoneUsers && phoneUsers.length > 0) {
          console.log('Found users by phone:', phoneUsers);
          return phoneUsers;
        }
      }
    }
    
    // Otherwise search by text terms (name, email, phone, cpf)
    console.log('Performing general text search for:', searchTerm);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
      .neq('id', vendorUserId || '')  // Exclude vendor
      .order('nome')
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

// Adds a customer to the vendor's customer list if they don't already exist
export const addVendorCustomer = async (customerData: {
  usuario_id: string;
  nome: string;
  email?: string;
  telefone?: string;
}): Promise<VendorCustomer | null> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return null;
    }
    
    console.log('Adding customer for vendor:', vendorProfile.id, customerData);
    
    // Check if customer already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .eq('usuario_id', customerData.usuario_id)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing customer:', checkError);
      return null;
    }
    
    if (existingCustomer) {
      console.log('Customer already exists:', existingCustomer);
      return existingCustomer as VendorCustomer;
    }
    
    // If customer doesn't exist, add them
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .insert([{
        vendedor_id: vendorProfile.id,
        usuario_id: customerData.usuario_id,
        nome: customerData.nome,
        email: customerData.email,
        telefone: customerData.telefone,
        total_gasto: 0
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding customer:', error);
      return null;
    }
    
    console.log('Customer added successfully:', data);
    return data as VendorCustomer;
  } catch (error) {
    console.error('Error in addVendorCustomer:', error);
    return null;
  }
};

// This function will seed test customers if needed for development
export const seedTestCustomers = async (count: number = 5): Promise<boolean> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return false;
    }
    
    console.log(`Seeding ${count} test customers for vendor:`, vendorProfile.id);
    
    const testCustomers = Array.from({ length: count }).map((_, i) => ({
      vendedor_id: vendorProfile.id,
      usuario_id: crypto.randomUUID(),
      nome: `Cliente Teste ${i + 1}`,
      email: `cliente${i + 1}@teste.com`,
      telefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      total_gasto: Math.floor(Math.random() * 10000) / 100,
      ultimo_pedido: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString()
    }));
    
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .insert(testCustomers)
      .select();
      
    if (error) {
      console.error('Error seeding test customers:', error);
      return false;
    }
    
    console.log(`Successfully seeded ${data.length} test customers`);
    return true;
  } catch (error) {
    console.error('Error in seedTestCustomers:', error);
    return false;
  }
};

// Function to migrate customer data from existing point adjustments
export const migrateCustomersFromPointAdjustments = async (): Promise<boolean> => {
  try {
    // Get vendor profile
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return false;
    }
    
    // Get all point adjustments made by this vendor
    const { data: adjustments, error: adjustmentsError } = await supabase
      .from('pontos_ajustados')
      .select('usuario_id')
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
    if (adjustmentsError) {
      console.error('Error fetching point adjustments:', adjustmentsError);
      return false;
    }
    
    if (!adjustments || adjustments.length === 0) {
      console.log('No point adjustments found for this vendor');
      return false;
    }
    
    console.log(`Found ${adjustments.length} point adjustments for migration`);
    
    // Extract unique customer IDs from adjustments
    const customerIds = [...new Set(adjustments.map(adj => adj.usuario_id))];
    console.log(`Found ${customerIds.length} unique customers to migrate`);
    
    // Fetch customer information from profiles
    const { data: customerProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .in('id', customerIds);
      
    if (profilesError) {
      console.error('Error fetching customer profiles:', profilesError);
      return false;
    }
    
    if (!customerProfiles || customerProfiles.length === 0) {
      console.log('No customer profiles found for migration');
      return false;
    }
    
    console.log(`Found ${customerProfiles.length} customer profiles to migrate`);
    
    // Prepare customer data for insertion
    const customersToAdd = customerProfiles.map(profile => ({
      vendedor_id: vendorProfile.id,
      usuario_id: profile.id,
      nome: profile.nome || 'Cliente sem nome',
      email: profile.email,
      telefone: profile.telefone,
      total_gasto: 0, // Default to 0 since we don't have order data
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert customers into clientes_vendedor table, skipping any that already exist
    const { data: insertedCustomers, error: insertError } = await supabase
      .from('clientes_vendedor')
      .upsert(customersToAdd, { 
        onConflict: 'vendedor_id,usuario_id',
        ignoreDuplicates: true 
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting customer data:', insertError);
      return false;
    }
    
    console.log(`Successfully migrated ${insertedCustomers?.length || 0} customers`);
    return true;
  } catch (error) {
    console.error('Error in migrateCustomersFromPointAdjustments:', error);
    return false;
  }
};

// Function to migrate customers data from existing orders
export const migrateCustomersFromOrders = async (): Promise<boolean> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return false;
    }
    
    console.log('Starting migration of customers from orders for vendor:', vendorProfile.id);
    
    // Import the migration helper dynamically
    const { setupAndMigrateCustomerData } = await import('./vendor/utils/migrateHelper');
    
    // Run the complete setup and migration
    const result = await setupAndMigrateCustomerData();
    
    console.log('Migration result:', result);
    
    if (result.success) {
      toast.success(result.message);
      return true;
    } else {
      toast.error(result.message);
      return false;
    }
  } catch (error) {
    console.error('Error in migrateCustomersFromOrders:', error);
    return false;
  }
};

// Function to get specific customer details by email
export const findCustomerByEmail = async (email: string): Promise<VendorCustomer | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return null;
    }
    
    // First find the user profile by email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .eq('email', email)
      .maybeSingle();
    
    if (profileError || !profileData) {
      console.error('Error finding profile by email or profile not found:', profileError);
      return null;
    }
    
    console.log('Found profile by email:', profileData);
    
    // Now check if this user is already a customer of this vendor
    const { data: customerData, error: customerError } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .eq('usuario_id', profileData.id)
      .maybeSingle();
    
    if (customerError) {
      console.error('Error checking for existing customer:', customerError);
      return null;
    }
    
    // If customer exists, return it
    if (customerData) {
      console.log('Customer already exists for this vendor:', customerData);
      return customerData as VendorCustomer;
    }
    
    // If not, create a new customer entry
    console.log('Creating new customer entry for profile:', profileData.id);
    const { data: newCustomer, error: createError } = await supabase
      .from('clientes_vendedor')
      .insert([{
        vendedor_id: vendorProfile.id,
        usuario_id: profileData.id,
        nome: profileData.nome || 'Cliente',
        email: profileData.email,
        telefone: profileData.telefone,
        total_gasto: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating new customer:', createError);
      return null;
    }
    
    console.log('Successfully created new customer:', newCustomer);
    return newCustomer as VendorCustomer;
  } catch (error) {
    console.error('Error in findCustomerByEmail:', error);
    return null;
  }
};
