
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Seeds test customer data for the current vendor
 */
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

/**
 * Migrates customers from point adjustments
 */
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
      nome: profile.nome || 'Usuário', // Ensure nome is always set, never undefined
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

/**
 * Migrates customers from orders using a database procedure
 */
export const migrateCustomersFromOrders = async (): Promise<boolean> => {
  try {
    console.log('Migrating customers from orders');
    
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
