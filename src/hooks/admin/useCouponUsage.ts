
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
      
      // Step 1: Fetch coupon usage records - simplified query first
      const { data: usageRecords, error: usageError } = await supabase
        .from('coupon_usage')
        .select('*')
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

      console.log('[useCouponUsage] Raw usage records:', usageRecords);

      // Step 2: Process each usage record individually
      const enrichedUsage: CouponUsageDetail[] = [];

      for (const usage of usageRecords) {
        console.log(`[useCouponUsage] Processing usage record:`, usage);

        // Get user data
        const { data: userData } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .eq('id', usage.user_id)
          .single();

        // Initialize the enriched usage record
        let enrichedRecord: CouponUsageDetail = {
          id: usage.id,
          coupon_id: usage.coupon_id,
          user_id: usage.user_id,
          order_id: usage.order_id,
          discount_amount: usage.discount_amount,
          used_at: usage.used_at,
          user_name: userData?.nome || 'Usuário não encontrado',
          user_email: userData?.email || '',
          order_total: 0,
          vendor_name: 'Não identificado',
          store_name: 'Não identificado',
          order_items: []
        };

        // If there's an order_id, try to get order and vendor info
        if (usage.order_id) {
          console.log(`[useCouponUsage] Fetching order data for order_id:`, usage.order_id);

          // Get order data
          const { data: orderData } = await supabase
            .from('orders')
            .select('id, valor_total')
            .eq('id', usage.order_id)
            .single();

          if (orderData) {
            enrichedRecord.order_total = orderData.valor_total || 0;
            console.log(`[useCouponUsage] Found order total:`, orderData.valor_total);
          }

          // Get order items
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', usage.order_id);

          if (orderItems && orderItems.length > 0) {
            console.log(`[useCouponUsage] Found ${orderItems.length} order items`);

            // Get the first product to determine vendor
            const { data: firstProduct } = await supabase
              .from('produtos')
              .select('id, nome, vendedor_id')
              .eq('id', orderItems[0].produto_id)
              .single();

            if (firstProduct) {
              // Get vendor info
              const { data: vendor } = await supabase
                .from('vendedores')
                .select('id, nome_loja')
                .eq('id', firstProduct.vendedor_id)
                .single();

              if (vendor) {
                enrichedRecord.vendor_name = vendor.nome_loja;
                enrichedRecord.store_name = vendor.nome_loja;
                console.log(`[useCouponUsage] Found vendor:`, vendor.nome_loja);
              }
            }

            // Process all order items
            const processedItems = [];
            for (const item of orderItems) {
              const { data: product } = await supabase
                .from('produtos')
                .select('id, nome, vendedor_id')
                .eq('id', item.produto_id)
                .single();

              const processedItem = {
                id: item.id,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal,
                produto: product ? {
                  nome: product.nome,
                  vendedor_id: product.vendedor_id
                } : undefined
              };

              processedItems.push(processedItem);
            }

            enrichedRecord.order_items = processedItems;
          }
        } else {
          console.log(`[useCouponUsage] No order_id for usage:`, usage.id);
        }

        console.log(`[useCouponUsage] Final enriched record:`, enrichedRecord);
        enrichedUsage.push(enrichedRecord);
      }

      console.log('[useCouponUsage] All enriched usage data:', enrichedUsage);
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
    } else {
      setUsageData([]);
    }
  }, [couponId]);

  return {
    usageData,
    isLoading,
    fetchCouponUsage
  };
};
