import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorCustomer } from './types';

/**
 * Enhanced customer search using secure RPC function
 */
export const searchAllProfiles = async (query: string): Promise<VendorCustomer[]> => {
  try {
    console.log('🔍 [searchAllProfiles] Starting search with query:', query);
    
    // Validate query length
    if (!query || query.length < 3) {
      console.log('📭 [searchAllProfiles] Query too short:', query);
      return [];
    }
    
    // Use the secure RPC function to search profiles
    const { data: profiles, error: profilesError } = await supabase
      .rpc('search_profiles_for_vendor', { search_query: query });
    
    console.log('🔍 [searchAllProfiles] RPC search result:', {
      profilesCount: profiles?.length || 0,
      profilesError,
      searchQuery: query
    });
    
    if (profilesError) {
      console.error('❌ [searchAllProfiles] Error in RPC search:', profilesError);
      
      // Handle specific error cases
      if (profilesError.message.includes('not authenticated')) {
        toast.error('Usuário não autenticado');
      } else if (profilesError.message.includes('not a registered vendor')) {
        toast.error('Usuário não está cadastrado como vendedor');
      } else if (profilesError.message.includes('not active or approved')) {
        toast.error('Vendedor não está ativo ou aprovado');
      } else if (profilesError.message.includes('at least 3 characters')) {
        toast.error('Digite pelo menos 3 caracteres para buscar');
      } else {
        toast.error('Erro ao buscar usuários: ' + profilesError.message);
      }
      return [];
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('📭 [searchAllProfiles] No profiles found for query:', query);
      return [];
    }
    
    console.log('✅ [searchAllProfiles] Found profiles:', profiles.map(p => ({
      id: p.id,
      nome: p.nome,
      email: p.email
    })));
    
    // Get current vendor ID for checking existing relationships
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [searchAllProfiles] No authenticated user found');
      return [];
    }
    
    const { data: vendorData } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    if (!vendorData) {
      console.error('❌ [searchAllProfiles] No vendor found for user');
      return [];
    }
    
    const vendorId = vendorData.id;
    
    // Get existing customer relationships for these profiles
    const profileIds = profiles.map(p => p.id);
    console.log('🔍 [searchAllProfiles] Looking for existing customer relationships for profile IDs:', profileIds);
    
    const { data: existingCustomers, error: customersError } = await supabase
      .from('clientes_vendedor')
      .select('usuario_id, id, total_gasto, ultimo_pedido, created_at, updated_at')
      .eq('vendedor_id', vendorId)
      .in('usuario_id', profileIds);
    
    console.log('🔍 [searchAllProfiles] Existing customers query result:', {
      existingCustomersCount: existingCustomers?.length || 0,
      customersError,
      existingCustomers: existingCustomers?.map(c => ({
        usuario_id: c.usuario_id,
        id: c.id,
        total_gasto: c.total_gasto
      }))
    });
    
    if (customersError) {
      console.error('❌ [searchAllProfiles] Error fetching existing customers:', customersError);
      // Don't return early here, we can still show the results without customer data
    }
    
    // Map the results to include customer relationship info
    const results: VendorCustomer[] = profiles.map(profile => {
      const existingCustomer = existingCustomers?.find(c => c.usuario_id === profile.id);
      
      const result = {
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
      
      console.log('🔗 [searchAllProfiles] Mapped result for profile:', {
        profileId: profile.id,
        profileName: profile.nome,
        hasExistingRelation: !!existingCustomer,
        relationId: existingCustomer?.id
      });
      
      return result;
    });
    
    console.log('✅ [searchAllProfiles] Final results:', {
      totalResults: results.length,
      newCustomers: results.filter(r => !r.vendedor_id).length,
      existingCustomers: results.filter(r => r.vendedor_id).length
    });
    
    return results;
  } catch (error) {
    console.error('💥 [searchAllProfiles] Unexpected error:', error);
    toast.error('Erro inesperado ao buscar usuários. Verifique o console para mais detalhes.');
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
    console.log('🔗 [ensureCustomerRelationship] Creating relationship:', { vendorId, userId, customerData });
    
    // Check if relationship already exists
    const { data: existingRelation, error: checkError } = await supabase
      .from('clientes_vendedor')
      .select('id')
      .eq('vendedor_id', vendorId)
      .eq('usuario_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('❌ [ensureCustomerRelationship] Error checking existing relationship:', checkError);
      return null;
    }
    
    // If relationship exists, return the existing ID
    if (existingRelation) {
      console.log('✅ [ensureCustomerRelationship] Customer relationship already exists:', existingRelation.id);
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
      console.error('❌ [ensureCustomerRelationship] Error creating customer relationship:', createError);
      toast.error('Erro ao criar relacionamento com cliente: ' + createError.message);
      return null;
    }
    
    console.log('✅ [ensureCustomerRelationship] Created new customer relationship:', newRelation.id);
    toast.success('Cliente adicionado à sua lista');
    return newRelation.id;
  } catch (error) {
    console.error('💥 [ensureCustomerRelationship] Unexpected error:', error);
    return null;
  }
};
