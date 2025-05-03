
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';
import { AdminStore } from '@/types/admin';

export const fetchAdminStores = async (): Promise<AdminStore[]> => {
  try {
    // Fetch directly from the vendedores table
    const { data: vendedores, error: vendedoresError } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        logo,
        usuario_id,
        status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (vendedoresError) {
      console.error('Error fetching vendors:', vendedoresError);
      throw vendedoresError;
    }
    
    // Get additional info for each vendor
    const storesWithDetails = await Promise.all((vendedores || []).map(async (vendedor) => {
      // Count products for this vendor
      const { count: productCount } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('vendedor_id', vendedor.id);
      
      // Get owner info
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('nome, email, telefone')
        .eq('id', vendedor.usuario_id)
        .single();
        
      return {
        id: vendedor.id,
        nome: vendedor.nome_loja,
        logo_url: vendedor.logo,
        proprietario_id: vendedor.usuario_id,
        proprietario_nome: ownerData?.nome || 'Desconhecido',
        status: vendedor.status || 'pendente',
        produtos_count: productCount || 0,
        contato: vendedor.whatsapp || vendedor.telefone || vendedor.email || ownerData?.telefone || ownerData?.email || 'N/A',
        created_at: vendedor.created_at,
        updated_at: vendedor.updated_at
      } as AdminStore;
    }));
    
    return storesWithDetails;
  } catch (error) {
    console.error('Error in fetchAdminStores:', error);
    toast.error('Erro ao carregar lojas');
    throw error;
  }
};

export const fetchPendingStores = async (): Promise<AdminStore[]> => {
  try {
    const stores = await fetchAdminStores();
    return stores.filter(store => store.status === 'pendente');
  } catch (error) {
    console.error('Error fetching pending stores:', error);
    toast.error('Erro ao carregar lojas pendentes');
    throw error;
  }
};

export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
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

export const rejectStore = async (storeId: string): Promise<boolean> => {
  try {
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
    
    toast.success('Loja rejeitada');
    return true;
  } catch (error) {
    console.error('Error rejecting store:', error);
    toast.error('Erro ao rejeitar loja');
    return false;
  }
};

export const deleteStore = async (storeId: string): Promise<boolean> => {
  try {
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

// Function to set up real-time subscription for vendor updates
export const subscribeToAdminStoreUpdates = (
  callback: (store: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
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

export { type AdminStore };
