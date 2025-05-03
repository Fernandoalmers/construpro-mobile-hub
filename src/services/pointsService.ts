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

export interface ReferralInfo {
  codigo: string;
  total_referrals: number;
  points_earned: number;
  referrals: Array<{
    id: string;
    data: string;
    status: 'pendente' | 'aprovado' | 'rejeitado';
    pontos: number;
    profiles: {
      nome: string;
    };
  }>;
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

// Referral service
export const referralService = {
  getReferralInfo: async (): Promise<ReferralInfo> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      // Get user's referral code
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('codigo')
        .eq('id', userData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching referral code:', profileError);
        throw new Error('Could not fetch referral code');
      }

      // Get referrals made by the user - explicitly specify the column name for profiles
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          data,
          status,
          pontos,
          profiles:referred_id (nome)
        `)
        .eq('referrer_id', userData.user.id);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        throw new Error('Could not fetch referrals');
      }

      // Type-safe referral data transformation
      const typedReferrals = (referralsData || []).map(ref => ({
        id: ref.id,
        data: ref.data,
        status: (ref.status as 'pendente' | 'aprovado' | 'rejeitado') || 'pendente',
        pontos: ref.pontos,
        profiles: {
          nome: ref.profiles?.nome || 'Usuário'
        }
      }));

      // Calculate total points earned from referrals
      const pointsEarned = typedReferrals.reduce((sum, ref) => sum + (ref.pontos || 0), 0) || 0;

      return {
        codigo: profileData.codigo || 'CONSTRUPRO',
        total_referrals: typedReferrals.length || 0,
        points_earned: pointsEarned,
        referrals: typedReferrals
      };
    } catch (error) {
      console.error('Error in getReferralInfo:', error);
      return {
        codigo: 'CONSTRUPRO',
        total_referrals: 0,
        points_earned: 0,
        referrals: []
      };
    }
  },

  // Apply referral code
  applyReferralCode: async (code: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      // Check if the code exists
      const { data: referrerData, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('codigo', code)
        .single();

      if (referrerError || !referrerData) {
        console.error('Invalid referral code:', referrerError);
        return false;
      }

      // Check if user is trying to refer themselves
      if (referrerData.id === userData.user.id) {
        console.error('Cannot use own referral code');
        return false;
      }

      // Check if the user has already been referred
      const { data: existingReferral, error: existingReferralError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', userData.user.id)
        .single();

      if (existingReferral) {
        console.error('User already has been referred');
        return false;
      }

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerData.id,
          referred_id: userData.user.id,
          status: 'pendente',
          pontos: 0
        });

      if (referralError) {
        console.error('Error creating referral:', referralError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in applyReferralCode:', error);
      return false;
    }
  }
};
