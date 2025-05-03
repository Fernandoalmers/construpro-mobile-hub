import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserProfile } from './userService';

export interface ReferralInfo {
  codigo: string;
  total_referrals: number;
  points_earned: number;
  referrals: ReferralDetail[];
}

export interface ReferralDetail {
  id: string;
  data: string;
  status: string;
  pontos: number;
  profiles: {
    nome: string;
  }
}

export const referralService = {
  // Process a referral code when a user signs up
  async processReferral(userId: string, referralCode: string): Promise<boolean> {
    try {
      if (!referralCode) return false;
      
      // Use the Supabase function to process the referral
      const { data, error } = await supabase.rpc('process_referral', {
        user_id: userId,
        referral_code: referralCode
      });
      
      if (error) {
        console.error('Error processing referral:', error);
        return false;
      }
      
      // Ensure we return a boolean
      return data === true;
    } catch (error) {
      console.error('Error in processReferral:', error);
      return false;
    }
  },

  // Get referral information for the current user
  async getReferralInfo(): Promise<ReferralInfo | null> {
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return null;
      }

      // Get user's profile to get their referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('codigo, saldo_pontos')
        .eq('id', userData.user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      // Get user's referrals with specific column selection for the profiles table
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id, 
          status, 
          pontos, 
          data,
          profiles:referred_id (nome)
        `)
        .eq('referrer_id', userData.user.id);
      
      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return null;
      }

      // Calculate total points earned from referrals
      const pointsEarned = referrals.reduce((sum, ref) => sum + (ref.pontos || 0), 0);

      // Cast the referrals to the expected type
      const typedReferrals = referrals as unknown as ReferralDetail[];

      return {
        codigo: profile.codigo || '',
        total_referrals: referrals.length,
        points_earned: pointsEarned,
        referrals: typedReferrals
      };
    } catch (error) {
      console.error('Error in getReferralInfo:', error);
      return null;
    }
  },

  // Get points transactions history
  async getPointsHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false });
      
      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getPointsHistory:', error);
      return [];
    }
  }
};

// Create a service for store management
export const storeService = {
  async saveStore(storeData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([storeData])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving store:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in saveStore:', error);
      return null;
    }
  },
  
  async getStoreByProfileId(profileId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('profile_id', profileId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store:', error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error in getStoreByProfileId:', error);
      return null;
    }
  }
};
