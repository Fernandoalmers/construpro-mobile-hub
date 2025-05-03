
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminStore } from '@/types/admin';

/**
 * Fetch all stores for admin management
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    // Fetch from lojas table
    const { data, error } = await supabase
      .from('lojas')
      .select(`
        id,
        nome,
        logo_url,
        proprietario_id,
        status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }
    
    // Get additional info for each store
    const storesWithDetails = await Promise.all((data || []).map(async (store) => {
      // Count products for this store
      const { count: productCount } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('vendedor_id', store.id);
      
      // Get owner info
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('nome, email, telefone')
        .eq('id', store.proprietario_id)
        .single();
        
      return {
        id: store.id,
        nome: store.nome,
        logo_url: store.logo_url,
        proprietario_id: store.proprietario_id,
        proprietario_nome: ownerData?.nome || 'Desconhecido',
        status: store.status || 'pendente',
        produtos_count: productCount || 0,
        contato: ownerData?.telefone || ownerData?.email || 'N/A',
        created_at: store.created_at,
        updated_at: store.updated_at
      } as AdminStore;
    }));
    
    return storesWithDetails;
  } catch (error) {
    console.error('Error in getAdminStores:', error);
    toast.error('Erro ao carregar lojas');
    throw error;
  }
};

/**
 * Fetch pending stores for admin approval
 */
export const getAdminPendingStores = async (): Promise<AdminStore[]> => {
  try {
    const stores = await getAdminStores();
    return stores.filter(store => store.status === 'pendente');
  } catch (error) {
    console.error('Error fetching pending stores:', error);
    toast.error('Erro ao carregar lojas pendentes');
    throw error;
  }
};

// Re-export existing functions for backward compatibility
export {
  approveStore,
  rejectStore,
  deleteStore,
  getStoreBadgeColor,
  subscribeToAdminStoreUpdates
} from '../adminStoresService';
