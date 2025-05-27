
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses?: number;
  used_count: number;
  starts_at?: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon_id?: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  message: string;
}

export interface CouponApplicationResult {
  success: boolean;
  discount_amount: number;
  message: string;
}

export const couponsService = {
  // Admin functions
  async getAllCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createCoupon(coupon: Omit<Coupon, 'id' | 'used_count' | 'created_at' | 'updated_at'>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .insert(coupon)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCoupon(id: string): Promise<void> {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // User functions
  async validateCoupon(code: string, orderValue: number): Promise<CouponValidationResult> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('validate_coupon', {
        coupon_code: code,
        user_id_param: user.user.id,
        order_value: orderValue
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      return { valid: false, message: 'Erro ao validar cupom' };
    }

    return data[0];
  },

  async applyCoupon(code: string, orderId: string, orderValue: number): Promise<CouponApplicationResult> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('apply_coupon', {
        coupon_code: code,
        user_id_param: user.user.id,
        order_id_param: orderId,
        order_value: orderValue
      });

    if (error) throw error;
    if (!data || data.length === 0) {
      return { success: false, discount_amount: 0, message: 'Erro ao aplicar cupom' };
    }

    return data[0];
  },

  async getCouponUsage(userId?: string) {
    const { data, error } = await supabase
      .from('coupon_usage')
      .select(`
        *,
        coupons (code, name, discount_type, discount_value)
      `)
      .eq(userId ? 'user_id' : 'user_id', userId || (await supabase.auth.getUser()).data.user?.id)
      .order('used_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
