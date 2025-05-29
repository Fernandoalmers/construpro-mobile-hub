
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
  order_total?: number;
  vendor_name?: string;
  store_name?: string;
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
      
      // Primeira query: buscar os usos do cupom com dados básicos do usuário
      const { data: usageRecords, error: usageError } = await supabase
        .from('coupon_usage')
        .select(`
          id,
          coupon_id,
          user_id,
          order_id,
          discount_amount,
          used_at,
          profiles!inner(nome, email)
        `)
        .eq('coupon_id', id)
        .order('used_at', { ascending: false });

      if (usageError) {
        console.error('[useCouponUsage] Error fetching usage:', usageError);
        toast.error('Erro ao carregar histórico de uso do cupom');
        return;
      }

      if (!usageRecords || usageRecords.length === 0) {
        console.log('[useCouponUsage] No usage found for coupon:', id);
        setUsageData([]);
        return;
      }

      console.log('[useCouponUsage] Found', usageRecords.length, 'usage records');

      // Para cada uso, buscar detalhes do pedido e vendedores
      const enrichedUsage: CouponUsageDetail[] = await Promise.all(
        usageRecords.map(async (usage: any) => {
          console.log('[useCouponUsage] Processing usage:', usage.id);
          
          const userProfile = usage.profiles;
          let orderTotal = 0;
          let vendorNames: string[] = [];
          let orderItems: any[] = [];

          if (usage.order_id) {
            // Buscar dados do pedido
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .select('valor_total')
              .eq('id', usage.order_id)
              .maybeSingle();

            if (orderError) {
              console.error('[useCouponUsage] Error fetching order:', orderError);
            } else if (orderData) {
              orderTotal = orderData.valor_total || 0;
              console.log('[useCouponUsage] Order total:', orderTotal);
            }

            // Buscar itens do pedido com dados dos produtos e vendedores
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                id,
                produto_id,
                quantidade,
                preco_unitario,
                subtotal,
                produtos!inner(
                  nome,
                  vendedor_id,
                  vendedores!inner(nome_loja)
                )
              `)
              .eq('order_id', usage.order_id);

            if (itemsError) {
              console.error('[useCouponUsage] Error fetching order items:', itemsError);
            } else if (itemsData && itemsData.length > 0) {
              console.log('[useCouponUsage] Found', itemsData.length, 'order items');
              
              orderItems = itemsData.map((item: any) => {
                const produto = item.produtos;
                if (produto && produto.vendedores && produto.vendedores.nome_loja) {
                  vendorNames.push(produto.vendedores.nome_loja);
                  console.log('[useCouponUsage] Found vendor:', produto.vendedores.nome_loja);
                }
                
                return {
                  id: item.id,
                  produto_id: item.produto_id,
                  quantidade: item.quantidade,
                  preco_unitario: item.preco_unitario,
                  subtotal: item.subtotal,
                  produto: produto ? {
                    nome: produto.nome || 'Produto não encontrado',
                    vendedor_id: produto.vendedor_id || '',
                    vendedores: produto.vendedores || null
                  } : {
                    nome: 'Produto não encontrado',
                    vendedor_id: '',
                    vendedores: null
                  }
                };
              });
            }
          }

          // Remover vendedores duplicados
          const uniqueVendors = [...new Set(vendorNames)];
          const vendorName = uniqueVendors.length > 0 ? uniqueVendors.join(', ') : 'Vendedor não identificado';
          
          console.log('[useCouponUsage] Final vendor name for usage', usage.id, ':', vendorName);

          return {
            id: usage.id,
            coupon_id: usage.coupon_id,
            user_id: usage.user_id,
            order_id: usage.order_id,
            discount_amount: usage.discount_amount,
            used_at: usage.used_at,
            user_name: userProfile?.nome || 'Usuário não encontrado',
            user_email: userProfile?.email || '',
            order_total: orderTotal,
            vendor_name: vendorName,
            store_name: vendorName,
            order_items: orderItems
          };
        })
      );

      console.log('[useCouponUsage] Final enriched data:', enrichedUsage);
      setUsageData(enrichedUsage);
    } catch (error: any) {
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
