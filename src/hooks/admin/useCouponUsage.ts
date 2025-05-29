
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
      
      // 1. Buscar registros básicos de uso do cupom
      const { data: usageRecords, error: usageError } = await supabase
        .from('coupon_usage')
        .select('id, coupon_id, user_id, order_id, discount_amount, used_at')
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

      // 2. Buscar dados dos usuários
      const userIds = usageRecords.map(record => record.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      if (usersError) {
        console.error('[useCouponUsage] Error fetching users:', usersError);
      }

      // 3. Buscar dados dos pedidos (se existirem)
      const orderIds = usageRecords
        .filter(record => record.order_id)
        .map(record => record.order_id!);

      let ordersData: any[] = [];
      if (orderIds.length > 0) {
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select('id, valor_total')
          .in('id', orderIds);

        if (ordersError) {
          console.error('[useCouponUsage] Error fetching orders:', ordersError);
        } else {
          ordersData = data || [];
        }
      }

      // 4. Buscar itens dos pedidos com produtos e vendedores
      let orderItemsData: any[] = [];
      let vendorsData: any[] = [];
      if (orderIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, order_id, produto_id, quantidade, preco_unitario, subtotal')
          .in('order_id', orderIds);

        if (itemsError) {
          console.error('[useCouponUsage] Error fetching order items:', itemsError);
        } else {
          orderItemsData = itemsData || [];

          // 5. Buscar produtos e vendedores se temos itens
          if (orderItemsData.length > 0) {
            const productIds = orderItemsData.map(item => item.produto_id);
            
            const { data: productsData, error: productsError } = await supabase
              .from('produtos')
              .select('id, nome, vendedor_id')
              .in('id', productIds);

            if (productsError) {
              console.error('[useCouponUsage] Error fetching products:', productsError);
            } else if (productsData && productsData.length > 0) {
              const vendorIds = [...new Set(productsData.map(p => p.vendedor_id))];
              
              const { data: vendors, error: vendorsError } = await supabase
                .from('vendedores')
                .select('id, nome_loja')
                .in('id', vendorIds);

              if (vendorsError) {
                console.error('[useCouponUsage] Error fetching vendors:', vendorsError);
              } else {
                vendorsData = vendors || [];
              }

              // Combinar dados dos produtos com vendedores
              orderItemsData = orderItemsData.map(item => {
                const produto = productsData.find(p => p.id === item.produto_id);
                const vendedor = produto ? vendorsData.find(v => v.id === produto.vendedor_id) : null;
                
                return {
                  ...item,
                  produto: produto ? {
                    nome: produto.nome,
                    vendedor_id: produto.vendedor_id,
                    vendedores: vendedor ? { nome_loja: vendedor.nome_loja } : null
                  } : null
                };
              });
            }
          }
        }
      }

      // 6. Combinar todos os dados
      const enrichedUsage: CouponUsageDetail[] = usageRecords.map(usage => {
        // Encontrar dados do usuário
        const userData = usersData?.find(u => u.id === usage.user_id);
        
        // Encontrar dados do pedido
        const orderData = ordersData.find(o => o.id === usage.order_id);
        
        // Encontrar itens do pedido
        const orderItems = orderItemsData.filter(item => item.order_id === usage.order_id);
        
        // Extrair nomes dos vendedores únicos
        const vendorNames = orderItems
          .map(item => item.produto?.vendedores?.nome_loja)
          .filter(name => name)
          .filter((name, index, arr) => arr.indexOf(name) === index);

        const vendorName = vendorNames.length > 0 
          ? vendorNames.join(', ') 
          : 'Vendedor não identificado';

        console.log('[useCouponUsage] Processing usage:', usage.id, 'vendor:', vendorName);

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
