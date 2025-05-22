
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Define VendorCustomer type that's being imported by multiple files
export interface VendorCustomer {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  ultimo_pedido?: string;
  total_gasto: number;
  created_at?: string;
  updated_at?: string;
}

export const getVendorCustomer = async (customerId: string) => {
  try {
    console.log('Fetching vendor customer with ID:', customerId);
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('id', customerId)
      .single();
    
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

// Add the getVendorCustomers function that's being imported
export const getVendorCustomers = async (): Promise<VendorCustomer[]> => {
  try {
    console.log('Fetching vendor customers');
    
    // Get the vendor ID of the current logged in user
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', supabase.auth.getUser().then(res => res.data.user?.id))
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

// Add the searchCustomers function that's being imported
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
    
    // Search for customers that match the query
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorId)
      .or(`nome.ilike.%${query}%,email.ilike.%${query}%,telefone.ilike.%${query}%,cpf.ilike.%${query}%`);
    
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

// Add the findCustomerByEmail function
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

export const getCustomerPoints = async (userId: string) => {
  try {
    console.log('Fetching points for user ID:', userId);
    
    if (!userId) {
      console.warn('No user ID provided to getCustomerPoints');
      return 0;
    }
    
    // First, check if this is a usuario_id or a relation id
    const isFullUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    if (!isFullUUID) {
      console.warn('Invalid UUID format for user ID:', userId);
      return 0;
    }
    
    // Get the actual user ID from clientes_vendedor if needed
    let actualUserId = userId;
    
    // Check if this is a relation ID and get the real user ID
    const { data: relation } = await supabase
      .from('clientes_vendedor')
      .select('usuario_id')
      .eq('id', userId)
      .maybeSingle();
      
    if (relation?.usuario_id) {
      console.log('Found relation, using usuario_id:', relation.usuario_id);
      actualUserId = relation.usuario_id;
    }
    
    // Now get the points from the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('saldo_pontos')
      .eq('id', actualUserId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching customer points:', error);
      toast.error('Erro ao buscar pontos do cliente');
      return 0;
    }
    
    console.log('Customer points data:', profile);
    return profile?.saldo_pontos || 0;
  } catch (error) {
    console.error('Error in getCustomerPoints:', error);
    toast.error('Erro ao buscar pontos do cliente');
    return 0;
  }
};

// Add the addVendorCustomer function
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
    
    // Combine the customer data with the vendor ID
    const newCustomer = {
      ...customerData,
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

// Add the seedTestCustomers function
export const seedTestCustomers = async (count: number = 5): Promise<boolean> => {
  try {
    console.log('Seeding test customers:', count);
    
    // Get the vendor ID of the current logged in user
    const authUser = await supabase.auth.getUser();
    const userId = authUser.data.user?.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      toast.error('Usuário não autenticado');
      return false;
    }
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor');
      return false;
    }
    
    const vendorId = vendorData.id;
    
    // Create test customers
    const testCustomers = Array.from({ length: count }).map((_, index) => {
      const randomNum = Math.floor(Math.random() * 1000);
      const now = new Date();
      const randomDate = new Date(now.setDate(now.getDate() - Math.floor(Math.random() * 90)));
      
      return {
        vendedor_id: vendorId,
        usuario_id: userId, // This is a simplification - in reality, these should be real user IDs
        nome: `Cliente Teste ${randomNum}`,
        email: `cliente${randomNum}@teste.com`,
        telefone: `(11) 9${randomNum}-${randomNum}`,
        cpf: `${randomNum}${randomNum}${randomNum}${randomNum}`,
        ultimo_pedido: randomDate.toISOString(),
        total_gasto: Math.floor(Math.random() * 500) * 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    // Insert the test customers
    const { error } = await supabase
      .from('clientes_vendedor')
      .insert(testCustomers);
    
    if (error) {
      console.error('Error seeding test customers:', error);
      toast.error('Erro ao criar clientes de teste');
      return false;
    }
    
    toast.success(`${count} clientes de teste criados com sucesso!`);
    return true;
  } catch (error) {
    console.error('Error in seedTestCustomers:', error);
    toast.error('Erro ao criar clientes de teste');
    return false;
  }
};

// Add the migrateCustomersFromPointAdjustments function
export const migrateCustomersFromPointAdjustments = async (): Promise<boolean> => {
  try {
    console.log('Migrating customers from point adjustments');
    
    // Get the vendor ID of the current logged in user
    const authUser = await supabase.auth.getUser();
    const userId = authUser.data.user?.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      toast.error('Usuário não autenticado');
      return false;
    }
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor');
      return false;
    }
    
    const vendorId = vendorData.id;
    
    // Get all point adjustments for this vendor
    const { data: adjustments, error: adjustmentsError } = await supabase
      .from('pontos_ajustados')
      .select('usuario_id')
      .eq('vendedor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (adjustmentsError) {
      console.error('Error fetching point adjustments:', adjustmentsError);
      toast.error('Erro ao buscar ajustes de pontos');
      return false;
    }
    
    if (!adjustments || adjustments.length === 0) {
      toast.info('Nenhum ajuste de pontos encontrado para migração');
      return false;
    }
    
    // Get unique user IDs
    const uniqueUserIds = [...new Set(adjustments.map(a => a.usuario_id))];
    console.log(`Found ${uniqueUserIds.length} unique users from point adjustments`);
    
    // Get user profiles for these IDs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', uniqueUserIds);
    
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      toast.error('Erro ao buscar perfis de usuários');
      return false;
    }
    
    if (!profiles || profiles.length === 0) {
      toast.info('Nenhum perfil de usuário encontrado para migração');
      return false;
    }
    
    // Create customers from profiles
    const customersToInsert = profiles.map(profile => ({
      vendedor_id: vendorId,
      usuario_id: profile.id,
      nome: profile.nome || 'Usuário',
      email: profile.email,
      telefone: profile.telefone,
      cpf: profile.cpf,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert customers, ignoring any that already exist
    const { error: insertError } = await supabase
      .from('clientes_vendedor')
      .upsert(customersToInsert, { onConflict: 'vendedor_id,usuario_id' });
    
    if (insertError) {
      console.error('Error inserting migrated customers:', insertError);
      toast.error('Erro ao migrar clientes');
      return false;
    }
    
    toast.success(`${customersToInsert.length} clientes migrados com sucesso!`);
    return true;
  } catch (error) {
    console.error('Error in migrateCustomersFromPointAdjustments:', error);
    toast.error('Erro ao migrar clientes');
    return false;
  }
};

// Add the migrateCustomersFromOrders function
export const migrateCustomersFromOrders = async (): Promise<boolean> => {
  try {
    console.log('Migrating customers from orders');
    
    // Get the vendor ID of the current logged in user
    const authUser = await supabase.auth.getUser();
    const userId = authUser.data.user?.id;
    
    if (!userId) {
      console.error('No authenticated user found');
      toast.error('Usuário não autenticado');
      return false;
    }
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor');
      return false;
    }
    
    const vendorId = vendorData.id;
    
    // Execute the RPC function to migrate customers from orders
    const { data, error } = await supabase.rpc('run_orders_migration');
    
    if (error) {
      console.error('Error running orders migration RPC:', error);
      toast.error('Erro ao migrar clientes de pedidos');
      return false;
    }
    
    toast.success('Clientes migrados dos pedidos com sucesso!');
    console.log('Migration result:', data);
    return true;
  } catch (error) {
    console.error('Error in migrateCustomersFromOrders:', error);
    toast.error('Erro ao migrar clientes de pedidos');
    return false;
  }
};
