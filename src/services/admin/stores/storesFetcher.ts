
import { supabase } from '@/integrations/supabase/client';
import { AdminStore } from '@/types/admin';

/**
 * Fetch all stores for admin management
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    console.log('[getAdminStores] executando fetch');
    
    // Modified query to avoid join issues - fetch vendedores first
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
        produtos(id)
      `)
      .order('created_at', { ascending: false });
    
    console.log('[getAdminStores] retorno:', data, error);
    
    if (error) {
      throw error;
    }

    console.log(`[getAdminStores] Found ${data?.length || 0} stores in 'vendedores' table`);
    
    // Get user profiles separately to avoid join issues
    const stores = await Promise.all((data || []).map(async (item) => {
      let profileName = 'Desconhecido';
      let profileEmail = 'sem-email';
      
      // Only fetch profile if usuario_id exists
      if (item.usuario_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('id', item.usuario_id)
          .single();
          
        if (profileData) {
          profileName = profileData.nome || 'Desconhecido';
          profileEmail = profileData.email || 'sem-email';
        }
      }
      
      return {
        id: item.id,
        nome: item.nome_loja,
        nome_loja: item.nome_loja,
        descricao: item.descricao || '',
        status: item.status || 'pendente',
        usuarioId: item.usuario_id,
        proprietario_id: item.usuario_id,
        proprietario_nome: profileName,
        proprietario_email: profileEmail,
        telefone: item.telefone || '',
        whatsapp: item.whatsapp || '',
        logo_url: item.logo || '',
        produtos_count: Array.isArray(item.produtos) ? item.produtos.length : 0, 
        contato: item.telefone || item.whatsapp || '',
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    }));

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
