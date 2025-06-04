
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorCustomer } from './types';

/**
 * Enhanced customer search that looks in all profiles, not just existing customers
 */
export const searchAllProfiles = async (query: string): Promise<VendorCustomer[]> => {
  try {
    console.log('🔍 [searchAllProfiles] Starting search with query:', query);
    
    // Get the vendor ID of the current logged in user
    const authResult = await supabase.auth.getUser();
    console.log('🔍 [searchAllProfiles] Auth result:', {
      hasUser: !!authResult.data.user,
      userId: authResult.data.user?.id,
      email: authResult.data.user?.email,
      error: authResult.error
    });
    
    const userId = authResult.data.user?.id;
    
    if (!userId) {
      console.error('❌ [searchAllProfiles] No authenticated user found');
      toast.error('Usuário não autenticado');
      return [];
    }
    
    console.log('🔍 [searchAllProfiles] Looking for vendor with user ID:', userId);
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, usuario_id, nome_loja, status')
      .eq('usuario_id', userId)
      .maybeSingle();
    
    console.log('🔍 [searchAllProfiles] Vendor query result:', {
      vendorData,
      vendorError,
      hasVendor: !!vendorData
    });
      
    if (vendorError) {
      console.error('❌ [searchAllProfiles] Error fetching vendor:', vendorError);
      toast.error('Erro ao buscar identificação do vendedor: ' + vendorError.message);
      return [];
    }
    
    if (!vendorData) {
      console.error('❌ [searchAllProfiles] No vendor found for user:', userId);
      toast.error('Usuário não está cadastrado como vendedor. Entre em contato com o suporte.');
      return [];
    }
    
    const vendorId = vendorData.id;
    const vendorUserId = vendorData.usuario_id;
    
    console.log('✅ [searchAllProfiles] Vendor found:', {
      vendorId,
      vendorUserId,
      vendorName: vendorData.nome_loja,
      vendorStatus: vendorData.status
    });
    
    // Check vendor status - aceitar tanto "ativo" quanto "aprovado"
    const validStatuses = ['ativo', 'aprovado'];
    if (!validStatuses.includes(vendorData.status)) {
      console.warn('⚠️ [searchAllProfiles] Vendor is not active or approved:', vendorData.status);
      toast.error(`Vendedor não está ativo (status: ${vendorData.status}). Entre em contato com o suporte.`);
      return [];
    }
    
    console.log('🔍 [searchAllProfiles] Searching profiles with query:', query);
    
    // Search in all profiles excluding the vendor themselves
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, cpf')
      .neq('id', vendorUserId) // Exclude the vendor from results
      .or(`nome.ilike.%${query}%,email.ilike.%${query}%,telefone.ilike.%${query}%,cpf.ilike.%${query}%`)
      .limit(20);
    
    console.log('🔍 [searchAllProfiles] Profiles query result:', {
      profilesCount: profiles?.length || 0,
      profilesError,
      searchQuery: `nome.ilike.%${query}%,email.ilike.%${query}%,telefone.ilike.%${query}%,cpf.ilike.%${query}%`
    });
    
    if (profilesError) {
      console.error('❌ [searchAllProfiles] Error searching profiles:', profilesError);
      toast.error('Erro ao buscar usuários: ' + profilesError.message);
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
