
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';

export interface AdminStore {
  id: string;
  nome: string;
  logo_url: string | null;
  proprietario_id: string;
  proprietario_nome?: string;
  status: string;
  produtos_count: number;
  created_at: string;
  updated_at: string;
}

export const fetchAdminStores = async (): Promise<AdminStore[]> => {
  try {
    // Buscar as lojas
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
      
    if (lojasError) throw lojasError;

    // Preparar estrutura para guardar informações de proprietários
    const proprietarioIds = lojas
      .filter(loja => loja.proprietario_id)
      .map(loja => loja.proprietario_id);

    // Buscar nomes dos proprietários
    const { data: proprietarios, error: proprietariosError } = await supabase
      .from('profiles')
      .select('id, nome')
      .in('id', proprietarioIds);
      
    if (proprietariosError) throw proprietariosError;

    // Criar um mapa para associar rapidamente IDs de proprietários aos seus nomes
    const proprietarioMap = new Map();
    proprietarios?.forEach(p => proprietarioMap.set(p.id, p.nome));

    // Para cada loja, contar produtos associados
    const storesWithProductCounts = await Promise.all(lojas.map(async (loja) => {
      const { count, error: countError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('vendedor_id', loja.id);
        
      if (countError) {
        console.error('Error counting products for store:', countError);
        return {
          ...loja,
          proprietario_nome: proprietarioMap.get(loja.proprietario_id) || 'Desconhecido',
          produtos_count: 0
        };
      }
      
      return {
        ...loja,
        proprietario_nome: proprietarioMap.get(loja.proprietario_id) || 'Desconhecido',
        produtos_count: count || 0
      };
    }));
    
    return storesWithProductCounts;
  } catch (error) {
    console.error('Error fetching admin stores:', error);
    toast.error('Erro ao carregar lojas');
    throw error;
  }
};

export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lojas')
      .update({ status: 'ativa' })
      .eq('id', storeId);
      
    if (error) throw error;
    
    // Log the admin action
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
      .from('lojas')
      .update({ status: 'recusada' })
      .eq('id', storeId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_store',
      entityType: 'loja',
      entityId: storeId,
      details: { status: 'recusada' }
    });
    
    toast.success('Loja recusada');
    return true;
  } catch (error) {
    console.error('Error rejecting store:', error);
    toast.error('Erro ao recusar loja');
    return false;
  }
};

export const deleteStore = async (storeId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lojas')
      .update({ status: 'excluida' })
      .eq('id', storeId);
      
    if (error) throw error;
    
    // Log the admin action
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
