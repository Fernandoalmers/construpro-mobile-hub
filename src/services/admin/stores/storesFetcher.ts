
import { supabase } from '@/integrations/supabase/client';
import { AdminStore } from '@/types/admin';

/**
 * Fetch all stores for admin management
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    console.log('[getAdminStores] executando query vendedores');
    
    // Query vendedores table with user info
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        descricao,
        status,
        usuario_id,
        telefone,
        whatsapp,
        logo,
        created_at,
        updated_at,
        profiles:usuario_id (
          nome,
          email
        ),
        produtos (id)
      `)
      .order('created_at', { ascending: false });
    
    console.log('[getAdminStores] data:', data, 'error:', error);
    
    if (error) {
      throw error;
    }

    console.log(`[getAdminStores] Found ${data?.length || 0} stores in 'vendedores' table`);
    
    // Transform data to AdminStore format
    const stores = (data || []).map(item => {
      // Access profile data directly since we're joining properly
      const profile = item.profiles || {};
      
      return {
        id: item.id,
        nome: item.nome_loja,
        descricao: item.descricao || '',
        status: item.status || 'pendente',
        usuarioId: item.usuario_id,
        proprietario_id: item.usuario_id,
        proprietario_nome: profile.nome || 'Desconhecido',
        proprietario_email: profile.email || 'sem-email',
        telefone: item.telefone || '',
        whatsapp: item.whatsapp || '',
        logo_url: item.logo || '',
        produtos_count: Array.isArray(item.produtos) ? item.produtos.length : 0, 
        contato: item.telefone || item.whatsapp || '',
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    });

    // Log um exemplo de loja processada para depuração
    if (stores.length > 0) {
      console.log('[getAdminStores] Exemplo de loja processada:', stores[0]);
    }
    
    return stores;
  } catch (error) {
    console.error('[getAdminStores] Error in getAdminStores:', error);
    throw error;
  }
};

/**
 * Fetch pending stores for admin approval
 */
export const getAdminPendingStores = async (): Promise<AdminStore[]> => {
  try {
    console.log('[getAdminPendingStores] Buscando lojas pendentes');
    const allStores = await getAdminStores();
    const pendingStores = allStores.filter(store => store.status === 'pendente');
    console.log(`[getAdminPendingStores] Encontradas ${pendingStores.length} lojas pendentes`);
    return pendingStores;
  } catch (error) {
    console.error('[getAdminPendingStores] Error in getAdminPendingStores:', error);
    throw error;
  }
};
