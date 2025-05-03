
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '../adminService';
import { AdminStore } from '@/types/admin';

/**
 * Fetch all stores for admin management
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    // Fetch from vendedores table
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        logo,
        usuario_id,
        status,
        whatsapp,
        telefone,
        email,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
    
    console.log('Admin stores data from vendedores:', data);
    
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
        .eq('id', store.usuario_id)
        .single();
        
      return {
        id: store.id,
        nome: store.nome_loja,
        logo_url: store.logo,
        proprietario_id: store.usuario_id,
        proprietario_nome: ownerData?.nome || 'Desconhecido',
        status: store.status || 'pendente',
        produtos_count: productCount || 0,
        contato: store.whatsapp || store.telefone || store.email || ownerData?.telefone || ownerData?.email || 'N/A',
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
