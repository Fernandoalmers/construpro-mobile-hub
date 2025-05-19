
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface RedeemRequest {
  rewardId: string;
  pontos: number;
  addressId?: string;
}

export const redeemReward = async (request: RedeemRequest): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Start a transaction
    await supabase.rpc('begin_transaction');
    
    try {
      // 1. Create the redemption entry with status 'pendente'
      const { data: redemption, error: redemptionError } = await supabase
        .from('resgates')
        .insert({
          cliente_id: user.id,
          item: request.rewardId, // We'll actually store the rewardId here (for now)
          pontos: request.pontos,
          status: 'pendente',
          data: new Date().toISOString()
        })
        .select()
        .single();
      
      if (redemptionError) {
        throw redemptionError;
      }
      
      // 2. Deduct points from user's balance
      const { error: pointsError } = await supabase.rpc(
        'adjust_user_points', 
        { user_id: user.id, points_to_add: -request.pontos }
      );
      
      if (pointsError) {
        throw pointsError;
      }
      
      // 3. Create a record in points_transactions
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          pontos: -request.pontos,
          tipo: 'resgate',
          descricao: `Resgate de recompensa`,
          referencia_id: redemption.id
        });
      
      if (transactionError) {
        throw transactionError;
      }
      
      // Commit the transaction
      await supabase.rpc('commit_transaction');
      
      toast.success('Resgate solicitado com sucesso!');
      return true;
      
    } catch (err) {
      // Rollback the transaction in case of any error
      await supabase.rpc('rollback_transaction');
      throw err;
    }
    
  } catch (err: any) {
    console.error('Error redeeming reward:', err);
    toast.error(err.message || 'Erro ao resgatar recompensa');
    return false;
  }
};

export const getRedemptionHistory = async (): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return [];
    }
    
    const { data, error } = await supabase
      .from('resgates')
      .select('*')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching redemption history:', error);
      toast.error('Erro ao carregar histórico de resgates');
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in getRedemptionHistory:', err);
    return [];
  }
};
