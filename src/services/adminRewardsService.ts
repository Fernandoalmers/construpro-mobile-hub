
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';
import { AdminReward } from '@/types/admin';

export const fetchAdminRewards = async (): Promise<AdminReward[]> => {
  try {
    // Check if the recompensas table exists
    let tableExists = false;
    try {
      const { error } = await supabase
        .from('recompensas')
        .select('count')
        .limit(1)
        .single();
      
      tableExists = !error;
    } catch (err) {
      console.log('Rewards table does not exist yet');
      return [];
    }
    
    // If table doesn't exist, return empty array
    if (!tableExists) {
      console.log('Rewards table does not exist yet, returning empty data');
      return [];
    }
    
    // If table exists, fetch data
    const { data, error } = await supabase
      .from('recompensas')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching rewards:', error);
      throw error;
    }
    
    // Convert to AdminReward type
    const rewards: AdminReward[] = data?.map(item => ({
      id: item.id,
      nome: item.nome || '',
      descricao: item.descricao || '',
      pontos: item.pontos || 0,
      imagem_url: item.imagem_url || null,
      categoria: item.categoria || '',
      status: item.status || 'ativo',
      estoque: item.estoque || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    })) || [];
    
    return rewards;
  } catch (error) {
    console.error('Error fetching admin rewards:', error);
    toast.error('Erro ao carregar recompensas');
    return [];
  }
};

export const createReward = async (rewardData: Omit<AdminReward, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  try {
    // Check if the recompensas table exists
    let tableExists = false;
    try {
      const { error } = await supabase
        .from('recompensas')
        .select('count')
        .limit(1)
        .single();
      
      tableExists = !error;
    } catch (err) {
      toast.error('A tabela de recompensas não existe. Crie-a primeiro');
      return false;
    }
    
    // If table doesn't exist, show error
    if (!tableExists) {
      toast.error('A tabela de recompensas não existe. Crie-a primeiro');
      return false;
    }
    
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
    // Check if the recompensas table exists
    let tableExists = false;
    try {
      const { error } = await supabase
        .from('recompensas')
        .select('count')
        .limit(1)
        .single();
      
      tableExists = !error;
    } catch (err) {
      toast.error('A tabela de recompensas não existe');
      return false;
    }
    
    // If table doesn't exist, show error
    if (!tableExists) {
      toast.error('A tabela de recompensas não existe');
      return false;
    }
    
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

export const toggleRewardStatus = async (id: string, currentStatus: string): Promise<boolean> => {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
  
  try {
    // Check if the recompensas table exists
    let tableExists = false;
    try {
      const { error } = await supabase
        .from('recompensas')
        .select('count')
        .limit(1)
        .single();
      
      tableExists = !error;
    } catch (err) {
      toast.error('A tabela de recompensas não existe');
      return false;
    }
    
    // If table doesn't exist, show error
    if (!tableExists) {
      toast.error('A tabela de recompensas não existe');
      return false;
    }
    
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
    // Check if the recompensas table exists
    let tableExists = false;
    try {
      const { error } = await supabase
        .from('recompensas')
        .select('count')
        .limit(1)
        .single();
      
      tableExists = !error;
    } catch (err) {
      return [];
    }
    
    // If table doesn't exist, return empty array
    if (!tableExists) {
      return [];
    }
    
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
