
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface PromotionalCoupon {
  id: string;
  coupon_id: string;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  coupon: {
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
  };
}

export interface CreatePromotionalCouponData {
  coupon_id: string;
  featured?: boolean;
  display_order?: number;
}

// Buscar cupons promocionais para usuários
export const fetchPromotionalCoupons = async (): Promise<PromotionalCoupon[]> => {
  try {
    console.log('[PromotionalCoupons] Fetching promotional coupons...');
    
    const { data: promotionalCoupons, error } = await supabase
      .from('promotional_coupons')
      .select(`
        *,
        coupon:coupons(
          id,
          code,
          name,
          description,
          discount_type,
          discount_value,
          min_order_value,
          max_uses,
          used_count,
          starts_at,
          expires_at,
          active
        )
      `)
      .eq('featured', true)
      .order('display_order', { ascending: true });
      
    if (error) {
      console.error('[PromotionalCoupons] Error fetching promotional coupons:', error);
      throw error;
    }
    
    // Filtrar apenas cupons ativos e não expirados
    const activeCoupons = (promotionalCoupons || []).filter(pc => {
      const coupon = pc.coupon;
      if (!coupon || !coupon.active) return false;
      
      const now = new Date();
      
      // Verificar se ainda não começou
      if (coupon.starts_at && new Date(coupon.starts_at) > now) return false;
      
      // Verificar se já expirou
      if (coupon.expires_at && new Date(coupon.expires_at) < now) return false;
      
      // Verificar se ainda tem usos disponíveis
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return false;
      
      return true;
    });
    
    console.log(`[PromotionalCoupons] Found ${activeCoupons.length} active promotional coupons`);
    return activeCoupons as PromotionalCoupon[];
  } catch (error) {
    console.error('Error fetching promotional coupons:', error);
    toast.error('Erro ao carregar cupons promocionais');
    return [];
  }
};

// Buscar todos os cupons promocionais para admin
export const fetchAllPromotionalCoupons = async (): Promise<PromotionalCoupon[]> => {
  try {
    console.log('[PromotionalCoupons] Fetching all promotional coupons for admin...');
    
    const { data: promotionalCoupons, error } = await supabase
      .from('promotional_coupons')
      .select(`
        *,
        coupon:coupons(
          id,
          code,
          name,
          description,
          discount_type,
          discount_value,
          min_order_value,
          max_uses,
          used_count,
          starts_at,
          expires_at,
          active
        )
      `)
      .order('display_order', { ascending: true });
      
    if (error) {
      console.error('[PromotionalCoupons] Error fetching all promotional coupons:', error);
      throw error;
    }
    
    console.log(`[PromotionalCoupons] Found ${promotionalCoupons?.length || 0} promotional coupons`);
    return (promotionalCoupons || []) as PromotionalCoupon[];
  } catch (error) {
    console.error('Error fetching all promotional coupons:', error);
    toast.error('Erro ao carregar cupons promocionais');
    return [];
  }
};

// Criar cupom promocional
export const createPromotionalCoupon = async (data: CreatePromotionalCouponData): Promise<boolean> => {
  try {
    console.log('[PromotionalCoupons] Creating promotional coupon:', data.coupon_id);
    
    const { error } = await supabase
      .from('promotional_coupons')
      .insert([{
        ...data,
        featured: data.featured ?? true,
        display_order: data.display_order ?? 0
      }]);
      
    if (error) {
      console.error('[PromotionalCoupons] Error creating promotional coupon:', error);
      if (error.code === '23505') {
        toast.error('Este cupom já está configurado como promocional');
      } else {
        toast.error('Erro ao criar cupom promocional');
      }
      return false;
    }
    
    toast.success('Cupom promocional criado com sucesso');
    return true;
  } catch (error) {
    console.error('Error creating promotional coupon:', error);
    toast.error('Erro ao criar cupom promocional');
    return false;
  }
};

// Atualizar cupom promocional
export const updatePromotionalCoupon = async (id: string, data: Partial<CreatePromotionalCouponData>): Promise<boolean> => {
  try {
    console.log('[PromotionalCoupons] Updating promotional coupon:', id);
    
    const { error } = await supabase
      .from('promotional_coupons')
      .update(data)
      .eq('id', id);
      
    if (error) {
      console.error('[PromotionalCoupons] Error updating promotional coupon:', error);
      toast.error('Erro ao atualizar cupom promocional');
      return false;
    }
    
    toast.success('Cupom promocional atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating promotional coupon:', error);
    toast.error('Erro ao atualizar cupom promocional');
    return false;
  }
};

// Deletar cupom promocional
export const deletePromotionalCoupon = async (id: string): Promise<boolean> => {
  try {
    console.log('[PromotionalCoupons] Deleting promotional coupon:', id);
    
    const { error } = await supabase
      .from('promotional_coupons')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('[PromotionalCoupons] Error deleting promotional coupon:', error);
      toast.error('Erro ao remover cupom promocional');
      return false;
    }
    
    toast.success('Cupom promocional removido com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting promotional coupon:', error);
    toast.error('Erro ao remover cupom promocional');
    return false;
  }
};

// Toggle status do cupom promocional
export const togglePromotionalCouponStatus = async (id: string, featured: boolean): Promise<boolean> => {
  try {
    console.log('[PromotionalCoupons] Toggling promotional coupon status:', id, featured);
    
    const { error } = await supabase
      .from('promotional_coupons')
      .update({ featured })
      .eq('id', id);
      
    if (error) {
      console.error('[PromotionalCoupons] Error toggling promotional coupon status:', error);
      toast.error('Erro ao alterar status do cupom promocional');
      return false;
    }
    
    toast.success(`Cupom promocional ${featured ? 'ativado' : 'desativado'} com sucesso`);
    return true;
  } catch (error) {
    console.error('Error toggling promotional coupon status:', error);
    toast.error('Erro ao alterar status do cupom promocional');
    return false;
  }
};

// Reordenar cupons promocionais
export const reorderPromotionalCoupons = async (coupons: { id: string; display_order: number }[]): Promise<boolean> => {
  try {
    console.log('[PromotionalCoupons] Reordering promotional coupons...');
    
    const updates = coupons.map(coupon => 
      supabase
        .from('promotional_coupons')
        .update({ display_order: coupon.display_order })
        .eq('id', coupon.id)
    );
    
    const results = await Promise.all(updates);
    
    const hasError = results.some(result => result.error);
    if (hasError) {
      console.error('[PromotionalCoupons] Error reordering promotional coupons');
      toast.error('Erro ao reordenar cupons promocionais');
      return false;
    }
    
    toast.success('Cupons promocionais reordenados com sucesso');
    return true;
  } catch (error) {
    console.error('Error reordering promotional coupons:', error);
    toast.error('Erro ao reordenar cupons promocionais');
    return false;
  }
};

// Utilidades para formatação
export const formatDiscount = (type: 'percentage' | 'fixed', value: number): string => {
  if (type === 'percentage') {
    return `${value}%`;
  }
  return `R$ ${value.toFixed(2)}`;
};

export const formatExpiryDate = (date?: string): string => {
  if (!date) return 'Sem validade';
  
  const expiryDate = new Date(date);
  const now = new Date();
  
  if (expiryDate < now) return 'Expirado';
  
  return `Válido até ${expiryDate.toLocaleDateString('pt-BR')}`;
};

export const getCouponStatusColor = (coupon: PromotionalCoupon['coupon']): string => {
  if (!coupon.active) return 'bg-red-100 text-red-800';
  
  const now = new Date();
  
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return 'bg-yellow-100 text-yellow-800';
  }
  
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return 'bg-gray-100 text-gray-800';
  }
  
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return 'bg-gray-100 text-gray-800';
  }
  
  return 'bg-green-100 text-green-800';
};

export const getCouponStatusText = (coupon: PromotionalCoupon['coupon']): string => {
  if (!coupon.active) return 'Inativo';
  
  const now = new Date();
  
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return 'Aguardando';
  }
  
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return 'Expirado';
  }
  
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return 'Esgotado';
  }
  
  return 'Ativo';
};
