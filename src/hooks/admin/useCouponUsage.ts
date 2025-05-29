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
      
      // Buscar dados de uso do cupom com JOIN para obter dados relacionados
      const { data: usageRecords, error } = await supabase
        .from('coupon_usage')
        .select(`
          id,
          coupon_id,
          user_id,
          order_id,
          discount_amount,
          used_at,
          profiles:user_id (
            nome,
            email
          ),
          orders:order_id (
            valor_total,
            order_items (
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
            )
          )
        `)
        .eq('coupon_id', id)
        .order('used_at', { ascending: false });

      if (error) {
        console.error('[useCouponUsage] Error fetching usage:', error);
        toast.error('Erro ao carregar histórico de uso do cupom');
        return;
      }

      if (!usageRecords || usageRecords.length === 0) {
        console.log('[useCouponUsage] No usage found for coupon:', id);
        setUsageData([]);
        return;
      }

      console.log('[useCouponUsage] Raw usage records:', usageRecords);

      // Processar dados com lógica simplificada para extrair nome do vendedor
      const enrichedUsage: CouponUsageDetail[] = usageRecords.map(usage => {
        const userData = usage.profiles;
        const orderData = usage.orders;
        
        // Extrair nome do vendedor dos itens do pedido
        let vendorName = 'Vendedor não identificado';
        let orderItems: any[] = [];
        
        if (orderData?.order_items && orderData.order_items.length > 0) {
          orderItems = orderData.order_items.map(item => ({
            id: item.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            produto: item.produtos ? {
              nome: item.produtos.nome,
              vendedor_id: item.produtos.vendedor_id,
              vendedores: item.produtos.vendedores ? {
                nome_loja: item.produtos.vendedores.nome_loja
              } : null
            } : null
          }));
          
          // Buscar primeiro vendedor válido nos itens
          const firstVendor = orderData.order_items
            .map(item => item.produtos?.vendedores?.nome_loja)
            .filter(nome => nome && nome.trim())[0];
            
          if (firstVendor) {
            vendorName = firstVendor;
          }
        }

        console.log(`[useCouponUsage] Processing usage ${usage.id}:`, {
          orderId: usage.order_id,
          extractedVendorName: vendorName,
          hasOrderItems: orderItems.length > 0,
          userData: userData ? `${userData.nome} (${userData.email})` : 'N/A'
        });

        return {
          id: usage.id,
          coupon_id: usage.coupon_id,
          user_id: usage.user_id,
          order_id: usage.order_id,
          discount_amount: usage.discount_amount,
          used_at: usage.used_at,
          user_name: userData?.nome || 'Usuário não encontrado',
          user_email: userData?.email || '',
          order_total: orderData?.valor_total || 0,
          vendor_name: vendorName,
          store_name: vendorName,
          order_items: orderItems
        };
      });

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
