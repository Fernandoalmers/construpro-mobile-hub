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
  specific_products?: CouponProduct[];
}

export interface CouponProduct {
  id: string;
  coupon_id: string;
  product_id: string;
  created_at: string;
  produto?: {
    id: string;
    nome: string;
    preco_normal: number;
    imagens?: any[];
  };
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
  product_ids?: string[];
}

export const fetchAdminCoupons = async (): Promise<AdminCoupon[]> => {
  try {
    console.log('[AdminCoupons] Fetching coupons...');
    
    // Primeira consulta: buscar todos os cupons
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (couponsError) {
      console.error('[AdminCoupons] Error fetching coupons:', couponsError);
      toast.error('Erro ao carregar cupons');
      throw couponsError;
    }
    
    if (!coupons || coupons.length === 0) {
      console.log('[AdminCoupons] No coupons found');
      return [];
    }
    
    console.log(`[AdminCoupons] Found ${coupons.length} coupons`);
    
    // Segunda consulta: contar usos reais por cupom
    const { data: usageCounts, error: usageError } = await supabase
      .from('coupon_usage')
      .select('coupon_id')
      .in('coupon_id', coupons.map(c => c.id));
    
    if (usageError) {
      console.error('[AdminCoupons] Error fetching usage counts:', usageError);
      // Não falhar completamente, apenas usar contagem 0
    }
    
    // Contar usos por cupom
    const usageCountMap = new Map<string, number>();
    if (usageCounts) {
      usageCounts.forEach(usage => {
        const currentCount = usageCountMap.get(usage.coupon_id) || 0;
        usageCountMap.set(usage.coupon_id, currentCount + 1);
      });
    }
    
    // Terceira consulta: buscar produtos específicos para todos os cupons
    const { data: couponProducts, error: productsError } = await supabase
      .from('coupon_products')
      .select(`
        id,
        coupon_id,
        product_id,
        created_at,
        produto:produtos(
          id,
          nome,
          preco_normal,
          imagens
        )
      `)
      .in('coupon_id', coupons.map(c => c.id));
    
    if (productsError) {
      console.error('[AdminCoupons] Error fetching coupon products:', productsError);
      // Não falhar completamente, apenas não incluir produtos específicos
    }
    
    // Agrupar produtos por cupom
    const productsMap = new Map<string, CouponProduct[]>();
    if (couponProducts) {
      couponProducts.forEach(cp => {
        const existing = productsMap.get(cp.coupon_id) || [];
        existing.push(cp as CouponProduct);
        productsMap.set(cp.coupon_id, existing);
      });
    }
    
    // Processar cupons com contagens reais
    const processedCoupons = coupons.map(coupon => {
      const realUsedCount = usageCountMap.get(coupon.id) || 0;
      const specificProducts = productsMap.get(coupon.id) || [];
      
      console.log(`[AdminCoupons] Coupon ${coupon.code}: DB used_count=${coupon.used_count}, Real count=${realUsedCount}`);
      
      return {
        ...coupon,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        used_count: realUsedCount, // Usar contagem real em vez do campo desatualizado
        specific_products: specificProducts
      };
    }) as AdminCoupon[];
    
    return processedCoupons;
  } catch (error) {
    console.error('Error fetching admin coupons:', error);
    toast.error('Erro ao carregar cupons');
    return [];
  }
};

export const createCoupon = async (couponData: CreateCouponData): Promise<boolean> => {
  try {
    console.log('[AdminCoupons] Creating coupon:', couponData.code);
    
    const { product_ids, ...couponFields } = couponData;
    
    const { data: createdCoupon, error } = await supabase
      .from('coupons')
      .insert([{
        ...couponFields,
        active: couponFields.active ?? true,
        used_count: 0
      }])
      .select()
      .single();
      
    if (error) {
      console.error('[AdminCoupons] Error creating coupon:', error);
      if (error.code === '23505') {
        toast.error('Já existe um cupom com este código');
      } else {
        toast.error('Erro ao criar cupom');
      }
      return false;
    }
    
    // Se há produtos específicos, criar as relações
    if (product_ids && product_ids.length > 0) {
      const couponProducts = product_ids.map(productId => ({
        coupon_id: createdCoupon.id,
        product_id: productId
      }));
      
      const { error: productsError } = await supabase
        .from('coupon_products')
        .insert(couponProducts);
        
      if (productsError) {
        console.error('[AdminCoupons] Error linking products:', productsError);
        // Remover o cupom criado se falhou ao vincular produtos
        await supabase.from('coupons').delete().eq('id', createdCoupon.id);
        toast.error('Erro ao vincular produtos ao cupom');
        return false;
      }
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'create_coupon',
      entityType: 'cupom',
      entityId: createdCoupon.id,
      details: { ...couponData, coupon_id: createdCoupon.id }
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
    
    const { product_ids, ...couponFields } = couponData;
    
    const { error } = await supabase
      .from('coupons')
      .update(couponFields)
      .eq('id', couponId);
      
    if (error) {
      console.error('[AdminCoupons] Error updating coupon:', error);
      toast.error('Erro ao atualizar cupom');
      return false;
    }
    
    // Se product_ids foi fornecido, atualizar produtos vinculados
    if (product_ids !== undefined) {
      // Remover produtos existentes
      await supabase
        .from('coupon_products')
        .delete()
        .eq('coupon_id', couponId);
      
      // Adicionar novos produtos se houver
      if (product_ids.length > 0) {
        const couponProducts = product_ids.map(productId => ({
          coupon_id: couponId,
          product_id: productId
        }));
        
        const { error: productsError } = await supabase
          .from('coupon_products')
          .insert(couponProducts);
          
        if (productsError) {
          console.error('[AdminCoupons] Error updating product links:', productsError);
          toast.error('Erro ao atualizar produtos vinculados');
          return false;
        }
      }
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

// Nova função para buscar produtos para seleção
export const fetchProductsForCoupon = async (searchTerm: string = ''): Promise<any[]> => {
  try {
    let query = supabase
      .from('produtos')
      .select(`
        id, 
        nome, 
        preco_normal, 
        preco_promocional,
        imagens, 
        categoria, 
        estoque,
        vendedor_id,
        vendedores:vendedor_id (
          nome_loja
        )
      `)
      .eq('status', 'aprovado')
      .order('nome');
    
    if (searchTerm) {
      query = query.ilike('nome', `%${searchTerm}%`);
    }
    
    const { data, error } = await query.limit(50);
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching products for coupon:', error);
    return [];
  }
};
