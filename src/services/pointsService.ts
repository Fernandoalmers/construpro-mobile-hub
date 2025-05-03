
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile } from "./userService";

export interface PointsTransaction {
  id: string;
  user_id: string;
  pontos: number;
  tipo: 'compra' | 'resgate' | 'indicacao' | 'loja-fisica' | 'servico' | 'ajuste';
  descricao: string;
  referencia_id?: string;
  data: string;
  created_at?: string;
}

// Get points transactions
export const getPointsTransactions = async (): Promise<PointsTransaction[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return [];
    }

    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('data', { ascending: false });

    if (error) {
      console.error('Error fetching points transactions:', error);
      return [];
    }

    return data as PointsTransaction[];
  } catch (error) {
    console.error('Error in getPointsTransactions:', error);
    return [];
  }
};

// Add points transaction
export const addPointsTransaction = async (
  points: number,
  type: PointsTransaction['tipo'],
  description: string,
  referenceId?: string
): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Start a transaction to ensure both operations succeed or fail together
    const { data, error } = await supabase.rpc('update_user_points', {
      user_id: userData.user.id,
      points_to_add: points
    });

    if (error) {
      console.error('Error updating user points:', error);
      return false;
    }

    const { error: txError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: userData.user.id,
        pontos: points,
        tipo: type,
        descricao: description,
        referencia_id: referenceId
      });

    if (txError) {
      console.error('Error creating points transaction:', txError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in addPointsTransaction:', error);
    return false;
  }
};

// Get current points balance
export const getCurrentPoints = async (): Promise<number> => {
  try {
    const profile = await getUserProfile();
    return profile?.saldo_pontos || 0;
  } catch (error) {
    console.error('Error in getCurrentPoints:', error);
    return 0;
  }
};
