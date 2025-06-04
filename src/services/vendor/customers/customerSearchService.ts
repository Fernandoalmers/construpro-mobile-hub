
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorCustomer } from './types';

/**
 * Enhanced customer search that looks in all profiles, not just existing customers
 */
export const searchAllProfiles = async (query: string): Promise<VendorCustomer[]> => {
  try {
    console.log('Searching all profiles with query:', query);
    
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
      .select('id, usuario_id')
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor');
      return [];
    }
    
    const vendorId = vendorData.id;
    const vendorUserId = vendorData.usuario_id;
    
    // Search in all profiles excluding the vendor themselves
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .neq('id', vendorUserId) // Exclude the vendor from results
      .or(`nome.ilike.%${query}%,email.ilike.%${query}%,telefone.ilike.%${query}%,cpf.ilike.%${query}%`)
      .limit(20);
    
    if (profilesError) {
      console.error('Error searching profiles:', profilesError);
      toast.error('Erro ao buscar usuários');
      return [];
    }
    
    if (!profiles || profiles.length === 0) {
      return [];
    }
    
    // Get existing customer relationships for these profiles
    const profileIds = profiles.map(p => p.id);
    const { data: existingCustomers, error: customersError } = await supabase
      .from('clientes_vendedor')
      .select('usuario_id, id, total_gasto, ultimo_pedido, created_at, updated_at')
      .eq('vendedor_id', vendorId)
      .in('usuario_id', profileIds);
    
    if (customersError) {
      console.error('Error fetching existing customers:', customersError);
    }
    
    // Map the results to include customer relationship info
    const results: VendorCustomer[] = profiles.map(profile => {
      const existingCustomer = existingCustomers?.find(c => c.usuario_id === profile.id);
      
      return {
        id: existingCustomer?.id || '', // Empty string for new customers
        usuario_id: profile.id,
        vendedor_id: existingCustomer ? vendorId : '', // Empty for new customers
        nome: profile.nome || 'Usuário',
        email: profile.email || '',
        telefone: profile.telefone || '',
        cpf: profile.cpf || '',
        total_gasto: existingCustomer?.total_gasto || 0,
        ultimo_pedido: existingCustomer?.ultimo_pedido || null,
        created_at: existingCustomer?.created_at || null,
        updated_at: existingCustomer?.updated_at || null
      };
    });
    
    console.log('Enhanced search results:', results);
    return results;
  } catch (error) {
    console.error('Error in searchAllProfiles:', error);
    toast.error('Erro ao buscar usuários');
    return [];
  }
};

/**
 * Ensures a customer relationship exists when a vendor selects a new customer
 */
export const ensureCustomerRelationship = async (
  vendorId: string,
  userId: string,
  customerData: {
    nome: string;
    email?: string;
    telefone?: string;
    cpf?: string;
  }
): Promise<string | null> => {
  try {
    console.log('Ensuring customer relationship exists:', { vendorId, userId, customerData });
    
    // Check if relationship already exists
    const { data: existingRelation, error: checkError } = await supabase
      .from('clientes_vendedor')
      .select('id')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing relationship:', checkError);
      return null;
    }
    
    // If relationship exists, return the existing ID
    if (existingRelation) {
      console.log('Customer relationship already exists:', existingRelation.id);
      return existingRelation.id;
    }
    
    // Create new customer relationship
    const { data: newRelation, error: createError } = await supabase
      .from('clientes_vendedor')
      .insert({
        vendedor_id: vendorId,
        usuario_id: userId,
        nome: customerData.nome,
        email: customerData.email,
        telefone: customerData.telefone,
        total_gasto: 0
      })
      .select('id')
      .single();
      
    if (createError) {
      console.error('Error creating customer relationship:', createError);
      toast.error('Erro ao criar relacionamento com cliente');
      return null;
    }
    
    console.log('Created new customer relationship:', newRelation.id);
    toast.success('Cliente adicionado à sua lista');
    return newRelation.id;
  } catch (error) {
    console.error('Error in ensureCustomerRelationship:', error);
    return null;
  }
};
