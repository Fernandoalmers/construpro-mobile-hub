import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';

export interface AdminCoupon {
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

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses?: number;
  starts_at?: string;
  expires_at?: string;
  active?: boolean;
}

export const fetchAdminCoupons = async (): Promise<AdminCoupon[]> => {
  try {
    console.log('[AdminCoupons] Fetching coupons...');
    
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[AdminCoupons] Error fetching coupons:', error);
      toast.error('Erro ao carregar cupons');
      throw error;
    }
    
    console.log(`[AdminCoupons] Found ${coupons?.length || 0} coupons`);
    
    // Type assertion to ensure compatibility with AdminCoupon interface
    return (coupons || []).map(coupon => ({
      ...coupon,
      discount_type: coupon.discount_type as 'percentage' | 'fixed'
    })) as AdminCoupon[];
  } catch (error) {
    console.error('Error fetching admin coupons:', error);
    toast.error('Erro ao carregar cupons');
    return [];
  }
};

export const createCoupon = async (couponData: CreateCouponData): Promise<boolean> => {
  try {
    console.log('[AdminCoupons] Creating coupon:', couponData.code);
    
    const { error } = await supabase
      .from('coupons')
      .insert([{
        ...couponData,
        active: couponData.active ?? true,
        used_count: 0
      }]);
      
    if (error) {
      console.error('[AdminCoupons] Error creating coupon:', error);
      if (error.code === '23505') {
        toast.error('Já existe um cupom com este código');
      } else {
        toast.error('Erro ao criar cupom');
      }
      return false;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'create_coupon',
      entityType: 'cupom',
      entityId: couponData.code,
      details: couponData
    });
    
    toast.success('Cupom criado com sucesso');
    return true;
  } catch (error) {
    console.error('Error creating coupon:', error);
    toast.error('Erro ao criar cupom');
    return false;
  }
};

export const updateCoupon = async (couponId: string, couponData: Partial<CreateCouponData>): Promise<boolean> => {
  try {
    console.log('[AdminCoupons] Updating coupon:', couponId);
    
    const { error } = await supabase
      .from('coupons')
      .update(couponData)
      .eq('id', couponId);
      
    if (error) {
      console.error('[AdminCoupons] Error updating coupon:', error);
      toast.error('Erro ao atualizar cupom');
      return false;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'update_coupon',
      entityType: 'cupom',
      entityId: couponId,
      details: couponData
    });
    
    toast.success('Cupom atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating coupon:', error);
    toast.error('Erro ao atualizar cupom');
    return false;
  }
};

export const deleteCoupon = async (couponId: string): Promise<boolean> => {
  try {
    console.log('[AdminCoupons] Deleting coupon:', couponId);
    
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);
      
    if (error) {
      console.error('[AdminCoupons] Error deleting coupon:', error);
      toast.error('Erro ao excluir cupom');
      return false;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'delete_coupon',
      entityType: 'cupom',
      entityId: couponId
    });
    
    toast.success('Cupom excluído com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    toast.error('Erro ao excluir cupom');
    return false;
  }
};

export const toggleCouponStatus = async (couponId: string, active: boolean): Promise<boolean> => {
  try {
    console.log('[AdminCoupons] Toggling coupon status:', couponId, active);
    
    const { error } = await supabase
      .from('coupons')
      .update({ active })
      .eq('id', couponId);
      
    if (error) {
      console.error('[AdminCoupons] Error toggling coupon status:', error);
      toast.error('Erro ao alterar status do cupom');
      return false;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'toggle_coupon_status',
      entityType: 'cupom',
      entityId: couponId,
      details: { active }
    });
    
    toast.success(`Cupom ${active ? 'ativado' : 'desativado'} com sucesso`);
    return true;
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    toast.error('Erro ao alterar status do cupom');
    return false;
  }
};

export const getCouponStatusBadgeColor = (active: boolean, expires_at?: string): string => {
  if (!active) {
    return 'bg-red-100 text-red-800';
  }
  
  if (expires_at && new Date(expires_at) < new Date()) {
    return 'bg-gray-100 text-gray-800';
  }
  
  return 'bg-green-100 text-green-800';
};

export const getCouponStatusText = (active: boolean, expires_at?: string): string => {
  if (!active) {
    return 'Inativo';
  }
  
  if (expires_at && new Date(expires_at) < new Date()) {
    return 'Expirado';
  }
  
  return 'Ativo';
};
