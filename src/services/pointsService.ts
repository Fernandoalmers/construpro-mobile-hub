
import { supabase } from "@/integrations/supabase/client";

export interface PointTransaction {
  id: string;
  user_id: string;
  pontos: number;
  tipo: 'compra' | 'resgate' | 'indicacao' | 'loja-fisica' | 'servico';
  referencia_id?: string;
  descricao: string;
  data: string;
}

export interface PointsBalance {
  saldo_pontos: number;
  transactions: PointTransaction[];
}

export const pointsService = {
  async getPointsBalance(): Promise<PointsBalance> {
    const { data, error } = await supabase.functions.invoke('points-management');
    
    if (error) {
      console.error('Error getting points balance:', error);
      throw error;
    }
    
    return {
      saldo_pontos: data?.saldo_pontos || 0,
      transactions: data?.transactions || []
    };
  },
  
  async addTransaction(transaction: Omit<PointTransaction, 'id' | 'user_id' | 'data'>): Promise<{ new_balance: number }> {
    const { data, error } = await supabase.functions.invoke('points-management', {
      method: 'POST',
      body: transaction
    });
    
    if (error) {
      console.error('Error adding points transaction:', error);
      throw error;
    }
    
    return { new_balance: data?.new_balance || 0 };
  }
}

export interface ReferralInfo {
  codigo: string;
  saldo_pontos: number;
  total_referrals: number;
  pending_referrals: number;
  approved_referrals: number;
  points_earned: number;
  referrals: Array<{
    id: string;
    status: 'pendente' | 'aprovado' | 'rejeitado';
    pontos: number;
    data: string;
    profiles: {
      nome: string;
      email: string;
      created_at: string;
    }
  }>;
}

export const referralService = {
  async getReferralInfo(): Promise<ReferralInfo> {
    const { data, error } = await supabase.functions.invoke('referral-processing');
    
    if (error) {
      console.error('Error getting referral info:', error);
      throw error;
    }
    
    return data as ReferralInfo;
  },
  
  async applyReferralCode(codigo: string): Promise<void> {
    const { error } = await supabase.functions.invoke('referral-processing', {
      method: 'POST',
      body: { codigo }
    });
    
    if (error) {
      console.error('Error applying referral code:', error);
      throw error;
    }
  },
  
  async approveReferral(referralId: string, pontos: number = 300): Promise<void> {
    const { error } = await supabase.functions.invoke('referral-processing', {
      method: 'PUT',
      body: { id: referralId, status: 'aprovado', pontos }
    });
    
    if (error) {
      console.error('Error approving referral:', error);
      throw error;
    }
  },
  
  async rejectReferral(referralId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('referral-processing', {
      method: 'PUT',
      body: { id: referralId, status: 'rejeitado' }
    });
    
    if (error) {
      console.error('Error rejecting referral:', error);
      throw error;
    }
  }
}
