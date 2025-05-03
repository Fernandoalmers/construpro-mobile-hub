
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminStore } from '@/types/admin';
import { logAdminAction } from '../adminService';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Fetch all stores for admin management
 */
export const getAdminStores = async (): Promise<AdminStore[]> => {
  try {
    console.log('Fetching admin stores from vendedores table...');
    
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
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }

    console.log('Admin stores data from vendedores:', data);
    
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
      contato: store.telefone || store.whatsapp || undefined
    }));
    
    console.log('Admin stores loaded:', stores);
    return stores;
  } catch (error) {
    console.error('Error in getAdminStores:', error);
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
      console.error('Error fetching pending stores:', error);
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
    console.error('Error in getAdminPendingStores:', error);
    toast.error('Erro ao carregar lojas pendentes');
    return [];
  }
};

/**
 * Approve a store
 */
export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('Approving store with ID:', storeId);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (error) {
      console.error('Error approving store:', error);
      throw error;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_store',
      entityType: 'vendedor',
      entityId: storeId,
      details: { status: 'aprovado' }
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
    console.log('Rejecting store with ID:', storeId);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (error) {
      console.error('Error rejecting store:', error);
      throw error;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_store',
      entityType: 'vendedor',
      entityId: storeId,
      details: { status: 'inativo' }
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
    const { data, error } = await supabase
      .from('vendedores')
      .delete()
      .eq('id', storeId);
      
    if (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'delete_store',
      entityType: 'vendedor',
      entityId: storeId,
      details: { action: 'delete' }
    });
    
    toast.success('Loja excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting store:', error);
    toast.error('Erro ao excluir loja');
    return false;
  }
};

/**
 * Get color for store status badge
 */
export const getStoreBadgeColor = (status: string): string => {
  switch (status) {
    case 'aprovado':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'inativo':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Subscribe to updates in the vendedores table for real-time admin updates
 */
export const subscribeToAdminStoreUpdates = (
  callback: (store: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  console.log('Setting up realtime subscription for vendedores table');
  
  const channel = supabase
    .channel('admin-store-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendedores',
      },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const storeData = payload.new || payload.old;
        callback(storeData, eventType);
      }
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      channel.unsubscribe();
    }
  };
};
