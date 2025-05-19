
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface RedeemRequest {
  rewardId: string;
  pontos: number;
  addressId?: string;
}

export const redeemReward = async (request: RedeemRequest): Promise<boolean> => {
  try {
    console.log('Starting reward redemption process with:', request);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Start a transaction
    await supabase.rpc('begin_transaction');
    
    try {
      // Check reward stock before proceeding
      const { data: reward, error: rewardError } = await supabase
        .from('resgates')
        .select('estoque, status, item')
        .eq('id', request.rewardId)
        .single();

      if (rewardError) {
        console.error('Reward fetch error:', rewardError);
        throw new Error('Recompensa não encontrada');
      }

      // Check if reward is active
      if (reward.status !== 'ativo') {
        throw new Error('Esta recompensa não está disponível no momento');
      }
      
      // Check if there's enough stock
      if (reward.estoque !== null && reward.estoque <= 0) {
        throw new Error('Esta recompensa está esgotada');
      }
      
      console.log('Creating redemption entry for:', reward.item);
      
      // 1. Create the redemption entry with status 'pendente'
      const { data: redemption, error: redemptionError } = await supabase
        .from('resgates')
        .insert({
          cliente_id: user.id,
          item: reward.item, // Use the actual item name
          pontos: request.pontos,
          status: 'pendente',
          data: new Date().toISOString()
        })
        .select()
        .single();
      
      if (redemptionError) {
        console.error('Redemption creation error:', redemptionError);
        throw redemptionError;
      }
      
      console.log('Created redemption record:', redemption);
      
      // 2. Deduct points from user's balance
      const { error: pointsError } = await supabase.rpc(
        'adjust_user_points', 
        { user_id: user.id, points_to_add: -request.pontos }
      );
      
      if (pointsError) {
        console.error('Points adjustment error:', pointsError);
        throw pointsError;
      }
      
      console.log('Points deducted successfully');
      
      // 3. Create a record in points_transactions - FIXED description using reward.item
      const transactionData = {
        user_id: user.id,
        pontos: -request.pontos,
        tipo: 'resgate',
        descricao: `Resgate de ${reward.item}`, // Important: Using the actual item name here
        referencia_id: redemption.id,
        data: new Date().toISOString() // Ensure we set the current date/time
      };
      
      console.log('Creating points transaction with:', transactionData);
      
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert(transactionData);
      
      if (transactionError) {
        console.error('Transaction record error:', transactionError);
        throw transactionError;
      }
      
      console.log('Points transaction recorded successfully');
      
      // 4. Update stock if it's not null
      if (reward.estoque !== null) {
        const { error: stockError } = await supabase
          .from('resgates')
          .update({ estoque: reward.estoque - 1 })
          .eq('id', request.rewardId);
          
        if (stockError) {
          console.error('Stock update error:', stockError);
          throw stockError;
        }
        
        console.log('Updated stock count');
      }
      
      // Commit the transaction
      await supabase.rpc('commit_transaction');
      
      toast.success('Resgate solicitado com sucesso!');
      console.log('Redemption process completed successfully');
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
