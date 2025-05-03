
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminStore } from '@/types/admin';

/**
 * Fetch all stores for admin management directly from Supabase
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    console.log('[AdminStoresFetcher] Fetching admin stores from vendedores table...');
    
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id, 
        nome_loja, 
        usuario_id, 
        status, 
        descricao,
        telefone,
        whatsapp,
        logo,
        banner,
        created_at, 
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    console.log('[AdminStores] data:', data, 'error:', error);
      
    if (error) {
      console.error('[AdminStoresFetcher] Error fetching stores:', error);
      throw error;
    }

    console.log('[AdminStoresFetcher] Fetched vendedores data:', data);
    
    // Transform vendedores data to AdminStore format
    const stores: AdminStore[] = await Promise.all((data || []).map(async (store) => {
      // Try to get product count
      let produtos_count = 0;
      try {
        const { count, error: countError } = await supabase
          .from('produtos')
          .select('id', { count: 'exact', head: true })
          .eq('vendedor_id', store.id);
          
        if (!countError) {
          produtos_count = count || 0;
        }
      } catch (err) {
        console.error(`[AdminStoresFetcher] Error fetching product count for store ${store.id}:`, err);
      }
      
      // Try to get owner name
      let proprietario_nome = undefined;
      try {
        if (store.usuario_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', store.usuario_id)
            .single();
            
          if (!profileError && profileData) {
            proprietario_nome = profileData.nome;
          }
        }
      } catch (err) {
        console.error(`[AdminStoresFetcher] Error fetching owner name for store ${store.id}:`, err);
      }

      return {
        id: store.id,
        nome: store.nome_loja,
        descricao: store.descricao || '',
        logo_url: store.logo || '',
        banner_url: store.banner || '',
        proprietario_id: store.usuario_id,
        proprietario_nome: proprietario_nome,
        status: store.status || 'pendente',
        created_at: store.created_at,
        updated_at: store.updated_at,
        produtos_count,
        contato: store.telefone || store.whatsapp || undefined
      };
    }));
    
    console.log('[AdminStoresFetcher] Transformed admin stores:', stores);
    return stores;
  } catch (error) {
    console.error('[AdminStoresFetcher] Error in getAdminStores:', error);
    toast.error('Erro ao carregar lojas');
    return [];
  }
};

/**
 * Fetch pending stores for admin approval
 */
export const getAdminPendingStores = async (): Promise<AdminStore[]> => {
  try {
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        usuario_id,
        status,
        descricao,
        telefone,
        logo,
        created_at,
        updated_at
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[AdminStoresFetcher] Error fetching pending stores:', error);
      throw error;
    }
    
    // Transform data to AdminStore format
    const stores: AdminStore[] = data.map(store => ({
      id: store.id,
      nome: store.nome_loja,
      descricao: store.descricao || '',
      logo_url: store.logo || '',
      proprietario_id: store.usuario_id,
      status: store.status || 'pendente',
      created_at: store.created_at,
      updated_at: store.updated_at,
      produtos_count: 0,  // Add default value for produtos_count
      contato: store.telefone || undefined
    }));
    
    return stores;
  } catch (error) {
    console.error('[AdminStoresFetcher] Error in getAdminPendingStores:', error);
    toast.error('Erro ao carregar lojas pendentes');
    return [];
  }
};
