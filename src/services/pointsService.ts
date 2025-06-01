
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
      
      // Use the functions.invoke method
      const { data, error } = await supabase.functions.invoke('referral-processing', {
        method: 'POST',
        body: { 
          codigo: referralCode 
        }
      });
      
      if (error) {
        console.error('Error processing referral:', error);
        return false;
      }
      
      // Ensure we return a boolean
      return data?.success === true;
    } catch (error) {
      console.error('Error in processReferral:', error);
      return false;
    }
  },

  // Get referral information for the current user
  async getReferralInfo(): Promise<ReferralInfo | null> {
    try {
      // Get referral info using the edge function
      const { data, error } = await supabase.functions.invoke('referral-processing', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error fetching referral info:', error);
        return null;
      }
      
      return data as ReferralInfo;
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
  },

  // NEW: Activate referral for user (called after purchase)
  async activateReferralForUser(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('referral-processing', {
        method: 'PUT',
        body: {
          action: 'activate_referral_on_purchase',
          user_id: userId
        }
      });
      
      if (error) {
        console.error('Error activating referral:', error);
        return false;
      }
      
      console.log('Referral activation result:', data.message);
      return data?.success === true;
    } catch (error) {
      console.error('Error in activateReferralForUser:', error);
      return false;
    }
  },

  // NEW: Fix all pending referrals (admin function)
  async fixPendingReferrals(): Promise<{ success: boolean; processed: number; activated: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('referral-processing', {
        method: 'PUT',
        body: {
          action: 'fix_pending_referrals'
        }
      });
      
      if (error) {
        console.error('Error fixing pending referrals:', error);
        return { success: false, processed: 0, activated: 0 };
      }
      
      return {
        success: data?.success === true,
        processed: data?.processed || 0,
        activated: data?.activated || 0
      };
    } catch (error) {
      console.error('Error in fixPendingReferrals:', error);
      return { success: false, processed: 0, activated: 0 };
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
        .maybeSingle();
      
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
