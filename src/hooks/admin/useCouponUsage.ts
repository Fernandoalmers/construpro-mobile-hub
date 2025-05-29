
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface CouponUsageDetail {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string | null;
  discount_amount: number;
  used_at: string;
  user_name?: string;
  user_email?: string;
  order_items?: {
    id: string;
    produto_id: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    produto?: {
      nome: string;
      vendedor_id: string;
      vendedores?: {
        nome_loja: string;
      };
    };
  }[];
}

export const useCouponUsage = (couponId?: string) => {
  const [usageData, setUsageData] = useState<CouponUsageDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCouponUsage = async (id: string) => {
    setIsLoading(true);
    try {
      console.log('[useCouponUsage] Fetching usage for coupon:', id);
      
      // Buscar usos do cupom com join explícito para profiles
      const { data: usage, error } = await supabase
        .from('coupon_usage')
        .select(`
          id,
          coupon_id,
          user_id,
          order_id,
          discount_amount,
          used_at
        `)
        .eq('coupon_id', id)
        .order('used_at', { ascending: false });

      if (error) {
        console.error('[useCouponUsage] Error fetching usage:', error);
        toast.error('Erro ao carregar histórico de uso do cupom');
        return;
      }

      console.log('[useCouponUsage] Found usage records:', usage?.length || 0);

      // Para cada uso, buscar informações do usuário e itens do pedido
      const enrichedUsage = await Promise.all((usage || []).map(async (use) => {
        // Buscar informações do usuário
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('id', use.user_id)
          .single();

        let orderItems = [];
        
        if (use.order_id) {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              id,
              produto_id,
              quantidade,
              preco_unitario,
              subtotal,
              produtos:produto_id (
                nome,
                vendedor_id,
                vendedores:vendedor_id (
                  nome_loja
                )
              )
            `)
            .eq('order_id', use.order_id);

          if (!itemsError && items) {
            orderItems = items;
          }
        }

        return {
          ...use,
          user_name: userProfile?.nome || 'Usuário não encontrado',
          user_email: userProfile?.email || '',
          order_items: orderItems
        };
      }));

      setUsageData(enrichedUsage);
    } catch (error) {
      console.error('[useCouponUsage] Error:', error);
      toast.error('Erro ao carregar dados de uso do cupom');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (couponId) {
      fetchCouponUsage(couponId);
    }
  }, [couponId]);

  return {
    usageData,
    isLoading,
    fetchCouponUsage
  };
};
