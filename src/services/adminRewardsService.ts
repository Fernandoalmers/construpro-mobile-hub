
import { supabase } from '@/integrations/supabase/client';
import { AdminReward } from '@/types/admin';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches all rewards from the system, safely handling if the table doesn't exist
 */
export const fetchRewards = async (): Promise<AdminReward[]> => {
  try {
    // First, check if the table exists using the function
    const { data: tableExists, error: checkError } = await supabase
      .rpc('is_admin')
      .select('*');
      
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
      nome: item.item, // Mapping from resgates.item to reward.nome
      descricao: item.item, // No direct description in resgates table
      pontos: item.pontos,
      imagem_url: item.imagem_url,
      categoria: 'Resgate', // Default category for resgates items
      status: item.status,
      estoque: null, // No estoque info in resgates
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at
    }));
  } catch (error) {
    console.error('Unexpected error fetching rewards:', error);
    return [];
  }
};

/**
 * Fetches a specific reward by ID
 */
export const fetchRewardById = async (rewardId: string): Promise<AdminReward | null> => {
  try {
    // Check admin status/permission
    const { error: adminError } = await supabase
      .rpc('is_admin')
      .select('*');

    if (adminError) {
      console.error('Admin check failed:', adminError);
      return null;
    }

    // Attempt to retrieve the reward
    const { data, error } = await supabase
      .from('resgates')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (error) {
      console.error('Error fetching reward by ID:', error);
      return null;
    }

    // Transform to AdminReward format
    return {
      id: data.id,
      nome: data.item,
      descricao: data.item,
      pontos: data.pontos,
      imagem_url: data.imagem_url,
      categoria: 'Resgate',
      status: data.status,
      estoque: null,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at
    };
  } catch (error) {
    console.error('Unexpected error fetching reward by ID:', error);
    return null;
  }
};

/**
 * Creates a new reward
 */
export const createReward = async (rewardData: Omit<AdminReward, 'id' | 'created_at' | 'updated_at'>): Promise<AdminReward | null> => {
  try {
    // First verify admin status
    const { error: adminError } = await supabase
      .rpc('is_admin')
      .select('*');

    if (adminError) {
      console.error('Admin check failed:', adminError);
      toast.error('Permissão negada: apenas administradores podem criar recompensas');
      return null;
    }
    
    // Insert the new reward into resgates table
    const { data, error } = await supabase
      .from('resgates')
      .insert({
        item: rewardData.nome,
        pontos: rewardData.pontos,
        imagem_url: rewardData.imagem_url,
        status: rewardData.status || 'pendente',
        // We don't have a direct field for descricao, categoria or estoque
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
      descricao: rewardData.descricao,
      pontos: data.pontos,
      imagem_url: data.imagem_url,
      categoria: rewardData.categoria,
      status: data.status,
      estoque: rewardData.estoque,
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
      .rpc('is_admin')
      .select('*');

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
        pontos: rewardData.pontos,
        imagem_url: rewardData.imagem_url,
        status: rewardData.status
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
      descricao: rewardData.descricao || data.item,
      pontos: data.pontos,
      imagem_url: data.imagem_url,
      categoria: rewardData.categoria || 'Resgate',
      status: data.status,
      estoque: rewardData.estoque || null,
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
      .rpc('is_admin')
      .select('*');

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
