
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
      
      // Buscar todos os usos do cupom com informações completas em uma única consulta
      const { data: usageWithDetails, error } = await supabase
        .from('coupon_usage')
        .select(`
          *,
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
              produtos (
                nome,
                vendedor_id,
                vendedores (
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

      if (!usageWithDetails || usageWithDetails.length === 0) {
        console.log('[useCouponUsage] No usage found for coupon:', id);
        setUsageData([]);
        return;
      }

      console.log('[useCouponUsage] Raw data from query:', usageWithDetails);

      // Processar os dados para o formato esperado
      const enrichedUsage: CouponUsageDetail[] = usageWithDetails.map((usage: any) => {
        console.log('[useCouponUsage] Processing usage:', usage.id);
        
        const userProfile = usage.profiles;
        const orderData = usage.orders;
        
        let orderItems: any[] = [];
        let orderTotal = 0;
        let vendorNames: string[] = [];

        if (orderData) {
          orderTotal = orderData.valor_total || 0;
          console.log('[useCouponUsage] Order total:', orderTotal);
          
          if (orderData.order_items && orderData.order_items.length > 0) {
            console.log('[useCouponUsage] Found', orderData.order_items.length, 'order items');
            
            orderItems = orderData.order_items.map((item: any) => {
              const produto = item.produtos;
              console.log('[useCouponUsage] Processing item:', item.id, 'product:', produto?.nome);
              
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
            
            // Extrair nomes únicos dos vendedores
            const uniqueVendors = new Set(vendorNames);
            vendorNames = Array.from(uniqueVendors);
            console.log('[useCouponUsage] Unique vendors found:', vendorNames);
          } else {
            console.log('[useCouponUsage] No order items found for order:', usage.order_id);
          }
        } else {
          console.log('[useCouponUsage] No order data found for usage:', usage.id);
        }

        const result = {
          id: usage.id,
          coupon_id: usage.coupon_id,
          user_id: usage.user_id,
          order_id: usage.order_id,
          discount_amount: usage.discount_amount,
          used_at: usage.used_at,
          user_name: userProfile?.nome || 'Usuário não encontrado',
          user_email: userProfile?.email || '',
          order_total: orderTotal,
          vendor_name: vendorNames.length > 0 ? vendorNames.join(', ') : 'Vendedor não identificado',
          store_name: vendorNames.length > 0 ? vendorNames.join(', ') : 'Loja não identificada',
          order_items: orderItems
        };

        console.log('[useCouponUsage] Final result for usage:', usage.id, '- vendor:', result.vendor_name);
        return result;
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
