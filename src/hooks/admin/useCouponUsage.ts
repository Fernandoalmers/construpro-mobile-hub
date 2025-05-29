
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
      
      // Consulta principal com JOINs para buscar todos os dados necessários
      const { data: usageRecordsRaw, error: usageError } = await supabase
        .from('coupon_usage')
        .select(`
          id,
          coupon_id,
          user_id,
          order_id,
          discount_amount,
          used_at,
          profiles:user_id (
            id,
            nome,
            email
          ),
          orders:order_id (
            id,
            valor_total,
            order_items (
              id,
              produto_id,
              quantidade,
              preco_unitario,
              subtotal,
              produtos (
                id,
                nome,
                vendedor_id,
                vendedores (
                  id,
                  nome_loja
                )
              )
            )
          )
        `)
        .eq('coupon_id', id)
        .order('used_at', { ascending: false });

      if (usageError) {
        console.error('[useCouponUsage] Error fetching usage:', usageError);
        toast.error('Erro ao carregar histórico de uso do cupom');
        return;
      }

      if (!usageRecordsRaw || usageRecordsRaw.length === 0) {
        console.log('[useCouponUsage] No usage found for coupon:', id);
        setUsageData([]);
        return;
      }

      console.log('[useCouponUsage] Raw usage records:', usageRecordsRaw);

      // Processar os dados para agrupar por order_id e consolidar vendedores
      const enrichedUsage: CouponUsageDetail[] = usageRecordsRaw.map(usage => {
        console.log(`[useCouponUsage] Processing usage record:`, usage);

        // Extrair dados do usuário
        const userProfile = usage.profiles as any;
        const userName = userProfile?.nome || 'Usuário não encontrado';
        const userEmail = userProfile?.email || '';

        // Extrair dados do pedido
        const orderData = usage.orders as any;
        const orderTotal = orderData?.valor_total || 0;
        const orderItems = orderData?.order_items || [];

        // Processar itens do pedido e extrair vendedores únicos
        const vendorNames = new Set<string>();
        const processedItems = orderItems.map((item: any) => {
          const produto = item.produtos;
          const vendedor = produto?.vendedores;
          
          if (vendedor?.nome_loja) {
            vendorNames.add(vendedor.nome_loja);
          }

          return {
            id: item.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            produto: produto ? {
              nome: produto.nome,
              vendedor_id: produto.vendedor_id
            } : undefined
          };
        });

        // Consolidar nomes dos vendedores
        const vendorNamesList = Array.from(vendorNames);
        const vendorDisplayName = vendorNamesList.length > 0 
          ? vendorNamesList.join(', ') 
          : 'Loja não identificada';

        console.log(`[useCouponUsage] Found vendors for order ${usage.order_id}:`, vendorNamesList);

        const enrichedRecord: CouponUsageDetail = {
          id: usage.id,
          coupon_id: usage.coupon_id,
          user_id: usage.user_id,
          order_id: usage.order_id,
          discount_amount: usage.discount_amount,
          used_at: usage.used_at,
          user_name: userName,
          user_email: userEmail,
          order_total: orderTotal,
          vendor_name: vendorDisplayName,
          store_name: vendorDisplayName,
          order_items: processedItems
        };

        console.log(`[useCouponUsage] Final enriched record:`, enrichedRecord);
        return enrichedRecord;
      });

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
