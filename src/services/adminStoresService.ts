import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';
import { AdminStore } from '@/types/admin';

export const fetchAdminStores = async (): Promise<AdminStore[]> => {
  try {
    // Tentar primeiro com a tabela 'lojas'
    const { data: lojas, error: lojasError } = await supabase
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
      
    if (!lojasError && lojas) {
      // Contar produtos por loja e obter informações do proprietário
      const storesWithCounts = await Promise.all(lojas.map(async (loja) => {
        const { count, error: countError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('vendedor_id', loja.id);
          
        // Fetch proprietário info separately since the relation isn't working
        const { data: proprietarioData, error: proprietarioError } = await supabase
          .from('profiles')
          .select('nome, email, telefone')
          .eq('id', loja.proprietario_id)
          .single();
          
        return {
          id: loja.id,
          nome: loja.nome,
          logo_url: loja.logo_url,
          proprietario_id: loja.proprietario_id,
          proprietario_nome: proprietarioData?.nome || 'Desconhecido',
          status: loja.status || 'pendente',
          produtos_count: count || 0,
          contato: proprietarioData?.telefone || proprietarioData?.email,
          created_at: loja.created_at,
          updated_at: loja.updated_at
        } as AdminStore;
      }));
      
      return storesWithCounts;
    }
    
    // Caso falhe, tentar com a tabela 'stores'
    console.log("Trying to fetch from 'stores' table instead");
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select(`
        id, 
        nome, 
        logo_url, 
        owner_id, 
        created_at, 
        updated_at,
        contato,
        descricao
      `)
      .order('created_at', { ascending: false });
      
    if (storesError) {
      console.error('Error fetching from stores table:', storesError);
      throw storesError;
    }

    // Contar produtos por store e obter informações do owner
    const storesWithCounts = await Promise.all(stores.map(async (store) => {
      const { count, error: countError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('vendedor_id', store.id);
        
      // Fetch owner info separately since the relation isn't working
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('id', store.owner_id)
        .single();
        
      return {
        id: store.id,
        nome: store.nome,
        descricao: store.descricao,
        logo_url: store.logo_url,
        proprietario_id: store.owner_id,
        proprietario_nome: ownerData?.nome || 'Desconhecido',
        status: 'ativa', // Default para stores se não tiver status
        produtos_count: count || 0,
        contato: store.contato || ownerData?.email,
        created_at: store.created_at,
        updated_at: store.updated_at
      } as AdminStore;
    }));
    
    return storesWithCounts;
  } catch (error) {
    console.error('Error fetching admin stores:', error);
    toast.error('Erro ao carregar lojas');
    throw error;
  }
};

export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
    // Tentar atualizar na tabela 'lojas' primeiro
    const { error: lojasError } = await supabase
      .from('lojas')
      .update({ status: 'ativa', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (!lojasError) {
      // Log da ação administrativa
      await logAdminAction({
        action: 'approve_store',
        entityType: 'loja',
        entityId: storeId,
        details: { status: 'ativa' }
      });
      
      toast.success('Loja aprovada com sucesso');
      return true;
    }
    
    // Se falhar com 'lojas', tentar com 'stores'
    const { error: storesError } = await supabase
      .from('stores')
      .update({ status: 'ativa', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (storesError) {
      console.error('Error updating store status:', storesError);
      throw storesError;
    }
    
    // Log da ação administrativa
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
    // Tentar atualizar na tabela 'lojas' primeiro
    const { error: lojasError } = await supabase
      .from('lojas')
      .update({ status: 'inativa', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (!lojasError) {
      // Log da ação administrativa
      await logAdminAction({
        action: 'reject_store',
        entityType: 'loja',
        entityId: storeId,
        details: { status: 'inativa' }
      });
      
      toast.success('Loja rejeitada');
      return true;
    }
    
    // Se falhar com 'lojas', tentar com 'stores'
    const { error: storesError } = await supabase
      .from('stores')
      .update({ status: 'inativa', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (storesError) {
      console.error('Error rejecting store:', storesError);
      throw storesError;
    }
    
    // Log da ação administrativa
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
    // Tentar atualizar na tabela 'lojas' primeiro
    const { error: lojasError } = await supabase
      .from('lojas')
      .update({ status: 'excluida', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (!lojasError) {
      // Log da ação administrativa
      await logAdminAction({
        action: 'delete_store',
        entityType: 'loja',
        entityId: storeId,
        details: { status: 'excluida' }
      });
      
      toast.success('Loja marcada como excluída');
      return true;
    }
    
    // Se falhar com 'lojas', tentar com 'stores'
    const { error: storesError } = await supabase
      .from('stores')
      .update({ status: 'excluida', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (storesError) {
      console.error('Error deleting store:', storesError);
      throw storesError;
    }
    
    // Log da ação administrativa
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

// Função para configurar subscription de realtime para atualizações de lojas
export const subscribeToAdminStoreUpdates = (
  callback: (store: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  const lojasChannel = supabase
    .channel('admin-lojas-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lojas'
      },
      (payload) => {
        console.log('Loja atualizada (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const store = payload.new;
        callback(store, eventType);
      }
    )
    .subscribe();
    
  const storesChannel = supabase
    .channel('admin-stores-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stores'
      },
      (payload) => {
        console.log('Store atualizada (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const store = payload.new;
        callback(store, eventType);
      }
    )
    .subscribe();
    
  return {
    lojasChannel,
    storesChannel,
    unsubscribe: () => {
      supabase.removeChannel(lojasChannel);
      supabase.removeChannel(storesChannel);
    }
  };
};

export { type AdminStore };
