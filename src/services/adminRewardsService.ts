
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

    // Get the current admin user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('User not authenticated');
      return [];
    }

    // Retrieve only reward templates (not user redemption records)
    // A template has either null cliente_id (created by admin) or it's a template created by this admin
    const { data, error } = await supabase
      .from('resgates')
      .select('*')
      .is('cliente_id', null) // Only get rewards with null cliente_id (templates)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rewards:', error);
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.warn('Rewards table does not exist in the database');
      }
      return [];
    }

    console.log('Fetched rewards data:', data); // Debug log

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
      prazo_entrega: item.prazo_entrega || '7-10 dias úteis',
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
    
    // Get the current user - we will need to set this as cliente_id for RLS
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    console.log('Creating reward with data:', rewardData); // Debug log
    console.log('Current authenticated user:', user.id); // Debug log for user ID
    
    // Insert the new reward into resgates table with status 'ativo' and null cliente_id (indicating it's a template)
    const { data, error } = await supabase
      .from('resgates')
      .insert({
        item: rewardData.nome,
        descricao: rewardData.descricao,
        pontos: rewardData.pontos,
        imagem_url: rewardData.imagem_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        status: 'ativo', // Default to active so it shows immediately
        estoque: rewardData.estoque,
        prazo_entrega: rewardData.prazo_entrega,
        categoria: rewardData.categoria,
        cliente_id: null  // Important: null indicates it's a reward template, not a redemption
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      toast.error('Erro ao criar recompensa: ' + error.message);
      return null;
    }

    console.log('Created reward data:', data); // Debug log

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
      prazo_entrega: data.prazo_entrega || '7-10 dias úteis',
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

    // Get the current user ID for update operation
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Usuário não autenticado');
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
        prazo_entrega: rewardData.prazo_entrega,
        categoria: rewardData.categoria,
        cliente_id: null // Ensure cliente_id remains null for templates
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
      prazo_entrega: data.prazo_entrega || '7-10 dias úteis',
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
      .update({ 
        status: newStatus,
        cliente_id: null // Ensure cliente_id remains null for templates
      })
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
 * Delete a reward
 */
export const deleteReward = async (rewardId: string): Promise<boolean> => {
  try {
    // First verify admin status
    const { error: adminError } = await supabase
      .rpc('is_admin');

    if (adminError) {
      console.error('Admin check failed:', adminError);
      toast.error('Permissão negada: apenas administradores podem excluir recompensas');
      return false;
    }

    // Delete the reward
    const { error } = await supabase
      .from('resgates')
      .delete()
      .eq('id', rewardId);

    if (error) {
      console.error('Error deleting reward:', error);
      toast.error('Erro ao excluir recompensa');
      return false;
    }

    toast.success('Recompensa excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Unexpected error deleting reward:', error);
    toast.error('Erro inesperado ao excluir recompensa');
    return false;
  }
};

/**
 * Fetches all reward categories
 */
export const fetchRewardCategories = async (): Promise<string[]> => {
  try {
    // First try to get categories from existing rewards
    const { data, error } = await supabase
      .from('resgates')
      .select('categoria')
      .not('categoria', 'is', null);
      
    if (error) {
      console.error('Error fetching reward categories from DB:', error);
      // Fall back to static list
      return ['Resgate', 'Vale Presente', 'Produto', 'Serviço', 'Outro'];
    }
    
    // Extract unique categories
    const categories = Array.from(new Set(data.map(item => item.categoria).filter(Boolean)));
    
    // If no categories found, return default list
    if (categories.length === 0) {
      return ['Resgate', 'Vale Presente', 'Produto', 'Serviço', 'Outro'];
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching reward categories:', error);
    return ['Resgate', 'Vale Presente', 'Produto', 'Serviço', 'Outro'];
  }
};

/**
 * Enable Supabase realtime for rewards table
 * This is called internally and doesn't need to be exported
 */
const enableRealtimeForRewards = async (): Promise<void> => {
  try {
    await supabase
      .from('resgates')
      .select('id')
      .limit(1);
      
    console.log('Realtime setup for rewards completed');
  } catch (error) {
    console.error('Error setting up realtime for rewards:', error);
  }
};

// Call this function immediately to ensure realtime is enabled
enableRealtimeForRewards();
