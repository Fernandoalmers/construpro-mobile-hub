
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '../adminService';
import { AdminStore } from '@/types/admin';

/**
 * Fetch all stores for admin management
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    console.log('Fetching admin stores from vendedores table...');
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

/**
 * Approve a store 
 */
export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('Approving store:', storeId);
    const { error } = await supabase
      .from('vendedores')
      .update({ status: 'ativa', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (error) {
      console.error('Error approving vendor:', error);
      throw error;
    }
    
    // Log administrative action
    await logAdminAction({
      action: 'approve_store',
      entityType: 'loja',
      entityId: storeId,
      details: { status: 'ativa' }
    });
    
    toast.success('Loja aprovada com sucesso');
    return true;
  } catch (error) {
    console.error('Error approving store:', error);
    toast.error('Erro ao aprovar loja');
    return false;
  }
};

/**
 * Reject a store
 */
export const rejectStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('Rejecting store:', storeId);
    const { error } = await supabase
      .from('vendedores')
      .update({ status: 'inativa', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (error) {
      console.error('Error rejecting vendor:', error);
      throw error;
    }
    
    // Log administrative action
    await logAdminAction({
      action: 'reject_store',
      entityType: 'loja',
      entityId: storeId,
      details: { status: 'inativa' }
    });
    
    toast.success('Loja rejeitada com sucesso');
    return true;
  } catch (error) {
    console.error('Error rejecting store:', error);
    toast.error('Erro ao rejeitar loja');
    return false;
  }
};

/**
 * Delete a store
 */
export const deleteStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('Marking store as deleted:', storeId);
    const { error } = await supabase
      .from('vendedores')
      .update({ status: 'excluida', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
    
    // Log administrative action
    await logAdminAction({
      action: 'delete_store',
      entityType: 'loja',
      entityId: storeId,
      details: { status: 'excluida' }
    });
    
    toast.success('Loja marcada como excluída');
    return true;
  } catch (error) {
    console.error('Error deleting store:', error);
    toast.error('Erro ao excluir loja');
    return false;
  }
};

/**
 * Get the badge color based on store status
 */
export const getStoreBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'ativa':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'recusada':
    case 'excluida':
      return 'bg-red-100 text-red-800';
    case 'inativa':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Function to set up real-time subscription for vendor updates
 */
export const subscribeToAdminStoreUpdates = (
  callback: (store: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  console.log('Setting up realtime subscription for vendedores table');
  const vendoresChannel = supabase
    .channel('admin-vendedores-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendedores'
      },
      (payload) => {
        console.log('Vendedor atualizado (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const store = payload.new;
        callback(store, eventType);
      }
    )
    .subscribe();
    
  return {
    unsubscribe: () => {
      supabase.removeChannel(vendoresChannel);
    }
  };
};
