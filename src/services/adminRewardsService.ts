
import { supabase } from '@/integrations/supabase/client';
import { AdminReward } from '@/types/admin';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches all rewards from the system, safely handling if the table doesn't exist
 */
export const fetchRewards = async (): Promise<AdminReward[]> => {
  try {
    // First, check if the user is an admin
    const { data: isAdmin, error: checkError } = await supabase
      .rpc('is_admin');
      
    if (checkError) {
      console.error('Error checking admin status:', checkError);
      return [];
    }

    // Since the rewards table might not exist in some installations,
    // we use the custom function and handle potential errors gracefully
    const { data, error } = await supabase
      .from('resgates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rewards:', error);
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.warn('Rewards table does not exist in the database');
      }
      return [];
    }

    // Safety measure to ensure we always return an array
    if (!data || !Array.isArray(data)) {
      console.warn('Unexpected response format for rewards');
      return [];
    }

    // Transform the data to match our AdminReward interface
    return data.map(item => ({
      id: item.id,
      nome: item.item || 'Sem nome', // Mapping from resgates.item to reward.nome
      descricao: item.descricao || item.item || 'Sem descrição',
      pontos: item.pontos,
      imagem_url: item.imagem_url,
      categoria: item.categoria || 'Resgate',
      status: item.status || 'pendente',
      estoque: item.estoque || null,
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at
    }));
  } catch (error) {
    console.error('Unexpected error fetching rewards:', error);
    return [];
  }
};

/**
 * Creates a new reward
 */
export const createReward = async (rewardData: Omit<AdminReward, 'id' | 'created_at' | 'updated_at'>): Promise<AdminReward | null> => {
  try {
    // First verify admin status
    const { error: adminError } = await supabase
      .rpc('is_admin');

    if (adminError) {
      console.error('Admin check failed:', adminError);
      toast.error('Permissão negada: apenas administradores podem criar recompensas');
      return null;
    }
    
    // We need to include cliente_id for the insertion to work
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }
    
    // Insert the new reward into resgates table
    const { data, error } = await supabase
      .from('resgates')
      .insert({
        item: rewardData.nome,
        descricao: rewardData.descricao,
        pontos: rewardData.pontos,
        imagem_url: rewardData.imagem_url,
        status: rewardData.status || 'pendente',
        estoque: rewardData.estoque,
        categoria: rewardData.categoria,
        cliente_id: user.id  // Required field
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      toast.error('Erro ao criar recompensa');
      return null;
    }

    toast.success('Recompensa criada com sucesso');

    // Transform to AdminReward format
    return {
      id: data.id,
      nome: data.item,
      descricao: data.descricao || data.item,
      pontos: data.pontos,
      imagem_url: data.imagem_url,
      categoria: data.categoria || 'Resgate',
      status: data.status,
      estoque: data.estoque,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at
    };
  } catch (error) {
    console.error('Unexpected error creating reward:', error);
    toast.error('Erro inesperado ao criar recompensa');
    return null;
  }
};

/**
 * Updates an existing reward
 */
export const updateReward = async (rewardId: string, rewardData: Partial<AdminReward>): Promise<AdminReward | null> => {
  try {
    // First verify admin status
    const { error: adminError } = await supabase
      .rpc('is_admin');

    if (adminError) {
      console.error('Admin check failed:', adminError);
      toast.error('Permissão negada: apenas administradores podem atualizar recompensas');
      return null;
    }

    // Update the reward in resgates table
    const { data, error } = await supabase
      .from('resgates')
      .update({
        item: rewardData.nome,
        descricao: rewardData.descricao,
        pontos: rewardData.pontos,
        imagem_url: rewardData.imagem_url,
        status: rewardData.status,
        estoque: rewardData.estoque,
        categoria: rewardData.categoria
      })
      .eq('id', rewardId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      toast.error('Erro ao atualizar recompensa');
      return null;
    }

    toast.success('Recompensa atualizada com sucesso');

    // Transform to AdminReward format
    return {
      id: data.id,
      nome: data.item,
      descricao: data.descricao || data.item,
      pontos: data.pontos,
      imagem_url: data.imagem_url,
      categoria: data.categoria || 'Resgate',
      status: data.status,
      estoque: data.estoque,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at
    };
  } catch (error) {
    console.error('Unexpected error updating reward:', error);
    toast.error('Erro inesperado ao atualizar recompensa');
    return null;
  }
};

/**
 * Toggle reward status between active and inactive
 */
export const toggleRewardStatus = async (rewardId: string, currentStatus: string): Promise<boolean> => {
  try {
    // First verify admin status
    const { error: adminError } = await supabase
      .rpc('is_admin');

    if (adminError) {
      console.error('Admin check failed:', adminError);
      toast.error('Permissão negada: apenas administradores podem alterar status');
      return false;
    }

    // Determine the new status
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

    // Update the status
    const { error } = await supabase
      .from('resgates')
      .update({ status: newStatus })
      .eq('id', rewardId);

    if (error) {
      console.error('Error toggling reward status:', error);
      toast.error('Erro ao alterar status da recompensa');
      return false;
    }

    toast.success(`Recompensa ${newStatus === 'ativo' ? 'ativada' : 'desativada'} com sucesso`);
    return true;
  } catch (error) {
    console.error('Unexpected error toggling reward status:', error);
    toast.error('Erro inesperado ao alterar status da recompensa');
    return false;
  }
};

/**
 * Fetches all reward categories
 */
export const fetchRewardCategories = async (): Promise<string[]> => {
  try {
    // Since we don't have a dedicated categories table for rewards,
    // we'll return a static list or extract from existing rewards
    return ['Resgate', 'Vale Presente', 'Produto', 'Serviço', 'Outro'];
  } catch (error) {
    console.error('Error fetching reward categories:', error);
    return [];
  }
};
