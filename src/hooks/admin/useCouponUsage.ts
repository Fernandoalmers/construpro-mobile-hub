
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
      
      // Primeiro, buscar todos os usos do cupom
      const { data: usage, error } = await supabase
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', id)
        .order('used_at', { ascending: false });

      if (error) {
        console.error('[useCouponUsage] Error fetching usage:', error);
        toast.error('Erro ao carregar histórico de uso do cupom');
        return;
      }

      console.log('[useCouponUsage] Raw usage data:', usage);

      if (!usage || usage.length === 0) {
        console.log('[useCouponUsage] No usage records found');
        setUsageData([]);
        return;
      }

      // Para cada uso, buscar informações do usuário e itens do pedido
      const enrichedUsage = await Promise.all(usage.map(async (use) => {
        console.log('[useCouponUsage] Processing usage:', use);
        
        // Buscar informações do usuário
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('id', use.user_id)
          .single();

        if (userError) {
          console.error('[useCouponUsage] Error fetching user profile:', userError);
        }

        let orderItems = [];
        
        if (use.order_id) {
          console.log('[useCouponUsage] Fetching order items for order:', use.order_id);
          
          // Buscar itens do pedido com informações do produto e vendedor
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

          if (itemsError) {
            console.error('[useCouponUsage] Error fetching order items:', itemsError);
          } else {
            orderItems = items || [];
            console.log('[useCouponUsage] Found order items:', orderItems.length);
          }
        }

        const enrichedUse = {
          ...use,
          user_name: userProfile?.nome || 'Usuário não encontrado',
          user_email: userProfile?.email || '',
          order_items: orderItems
        };

        console.log('[useCouponUsage] Enriched usage:', enrichedUse);
        return enrichedUse;
      }));

      console.log('[useCouponUsage] Final enriched usage data:', enrichedUsage);
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
      console.log('[useCouponUsage] useEffect triggered with couponId:', couponId);
      fetchCouponUsage(couponId);
    }
  }, [couponId]);

  return {
    usageData,
    isLoading,
    fetchCouponUsage
  };
};
