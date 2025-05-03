
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';

export interface AdminReward {
  id: string;
  nome: string;
  descricao: string;
  pontos: number;
  imagem_url: string | null;
  categoria: string;
  status: 'ativo' | 'inativo';
  estoque: number | null;
  created_at: string;
  updated_at: string;
}

export const fetchAdminRewards = async (): Promise<AdminReward[]> => {
  try {
    const { data, error } = await supabase
      .from('recompensas')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      // Se a tabela não existir, podemos considerar que ainda não foram criadas recompensas
      if (error.code === '42P01') { // código para tabela inexistente
        return [];
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching admin rewards:', error);
    toast.error('Erro ao carregar recompensas');
    return [];
  }
};

export const createReward = async (rewardData: Omit<AdminReward, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('recompensas')
      .insert({
        ...rewardData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'create_reward',
      entityType: 'recompensa',
      entityId: 'new',
      details: { nome: rewardData.nome, pontos: rewardData.pontos }
    });
    
    toast.success('Recompensa criada com sucesso');
    return true;
  } catch (error) {
    console.error('Error creating reward:', error);
    toast.error('Erro ao criar recompensa');
    return false;
  }
};

export const updateReward = async (id: string, rewardData: Partial<AdminReward>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('recompensas')
      .update({
        ...rewardData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'update_reward',
      entityType: 'recompensa',
      entityId: id,
      details: rewardData
    });
    
    toast.success('Recompensa atualizada com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating reward:', error);
    toast.error('Erro ao atualizar recompensa');
    return false;
  }
};

export const toggleRewardStatus = async (id: string, currentStatus: 'ativo' | 'inativo'): Promise<boolean> => {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
  
  try {
    const { error } = await supabase
      .from('recompensas')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'toggle_reward_status',
      entityType: 'recompensa',
      entityId: id,
      details: { status: newStatus }
    });
    
    toast.success(`Recompensa ${newStatus === 'ativo' ? 'ativada' : 'desativada'} com sucesso`);
    return true;
  } catch (error) {
    console.error('Error toggling reward status:', error);
    toast.error('Erro ao alterar status da recompensa');
    return false;
  }
};

export const fetchRewardCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('recompensas')
      .select('categoria')
      .order('categoria');
      
    if (error) throw error;
    
    const categories = data
      .map(item => item.categoria)
      .filter(Boolean) // Remove valores nulos ou undefined
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicatas
    
    return categories;
  } catch (error) {
    console.error('Error fetching reward categories:', error);
    return [];
  }
};

export const getRewardStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
