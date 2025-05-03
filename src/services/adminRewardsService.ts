import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';
import { AdminReward } from '@/types/admin';

export const fetchAdminRewards = async (): Promise<AdminReward[]> => {
  try {
    // Check if the recompensas table exists
    let tableExists = false;
    
    try {
      // Check if table exists using a safer method
      const { data: tableData, error: tableError } = await supabase
        .rpc('check_table_exists', { table_name: 'recompensas' });
      
      tableExists = tableData === true;
      
      if (tableError || !tableExists) {
        console.log('Rewards table does not exist yet');
        return [];
      }
    } catch (err) {
      console.log('Error checking if rewards table exists:', err);
      return [];
    }
    
    // If table exists, fetch data
    try {
      const { data, error } = await supabase
        .rpc('get_rewards');
        
      if (error) {
        throw error;
      }
      
      // Convert to AdminReward type
      const rewards: AdminReward[] = data?.map((item: any) => ({
        id: item.id || '',
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
      console.error('Error fetching rewards data:', error);
      return [];
    }
  } catch (error) {
    console.error('Error in fetchAdminRewards:', error);
    toast.error('Erro ao carregar recompensas');
    return [];
  }
};

// A function to safely check if a table exists before querying it
const safeTableOperation = async (tableName: string, operation: () => Promise<any>, defaultValue: any) => {
  try {
    const { data: tableExists, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: tableName });
      
    if (tableError || !tableExists) {
      return defaultValue;
    }
    
    return await operation();
  } catch (err) {
    console.error(`Error in operation on ${tableName}:`, err);
    return defaultValue;
  }
};

export const createReward = async (rewardData: Omit<AdminReward, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  try {
    return await safeTableOperation('recompensas', async () => {
      const { error } = await supabase.rpc('create_reward', {
        reward_data: {
          ...rewardData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
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
    }, false);
  } catch (error) {
    console.error('Error creating reward:', error);
    toast.error('Erro ao criar recompensa');
    return false;
  }
};

export const updateReward = async (id: string, rewardData: Partial<AdminReward>): Promise<boolean> => {
  try {
    return await safeTableOperation('recompensas', async () => {
      const { error } = await supabase.rpc('update_reward', {
        reward_id: id,
        reward_data: {
          ...rewardData,
          updated_at: new Date().toISOString()
        }
      });
      
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
    }, false);
  } catch (error) {
    console.error('Error updating reward:', error);
    toast.error('Erro ao atualizar recompensa');
    return false;
  }
};

export const toggleRewardStatus = async (id: string, currentStatus: string): Promise<boolean> => {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
  
  try {
    return await safeTableOperation('recompensas', async () => {
      const { error } = await supabase.rpc('toggle_reward_status', {
        reward_id: id,
        new_status: newStatus,
        updated_at: new Date().toISOString()
      });
      
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
    }, false);
  } catch (error) {
    console.error('Error toggling reward status:', error);
    toast.error('Erro ao alterar status da recompensa');
    return false;
  }
};

export const fetchRewardCategories = async (): Promise<string[]> => {
  return await safeTableOperation('recompensas', async () => {
    const { data, error } = await supabase.rpc('get_reward_categories');
      
    if (error) throw error;
    
    return data || [];
  }, []);
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
