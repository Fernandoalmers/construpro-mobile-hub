
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
        .select('*')
        .eq('coupon_id', id)
        .order('used_at', { ascending: false });

      if (usageError) {
        console.error('[useCouponUsage] Error fetching usage records:', usageError);
        toast.error('Erro ao carregar histórico de uso do cupom');
        return;
      }

      console.log('[useCouponUsage] Usage records found:', usageRecords?.length || 0);

      if (!usageRecords || usageRecords.length === 0) {
        console.log('[useCouponUsage] No usage found for coupon:', id);
        setUsageData([]);
        return;
      }

      // 2. Buscar dados dos usuários
      const userIds = usageRecords.map(usage => usage.user_id);
      const { data: userProfiles, error: usersError } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      if (usersError) {
        console.error('[useCouponUsage] Error fetching user profiles:', usersError);
      }

      console.log('[useCouponUsage] User profiles found:', userProfiles?.length || 0);

      // 3. Buscar dados dos pedidos
      const orderIds = usageRecords
        .map(usage => usage.order_id)
        .filter(Boolean) as string[];

      let orderData: any[] = [];
      let orderItems: any[] = [];

      if (orderIds.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, valor_total')
          .in('id', orderIds);

        if (ordersError) {
          console.error('[useCouponUsage] Error fetching orders:', ordersError);
        } else {
          orderData = orders || [];
          console.log('[useCouponUsage] Orders found:', orderData.length);
        }

        // 4. Buscar itens dos pedidos com produtos e vendedores
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            produtos!inner (
              id,
              nome,
              vendedor_id,
              vendedores!inner (
                id,
                nome_loja
              )
            )
          `)
          .in('order_id', orderIds);

        if (itemsError) {
          console.error('[useCouponUsage] Error fetching order items:', itemsError);
        } else {
          orderItems = items || [];
          console.log('[useCouponUsage] Order items found:', orderItems.length);
        }
      }

      // 5. Combinar todos os dados
      const enrichedUsage: CouponUsageDetail[] = usageRecords.map(usage => {
        // Encontrar dados do usuário
        const userProfile = userProfiles?.find(u => u.id === usage.user_id);
        const userName = userProfile?.nome || 'Usuário não encontrado';
        const userEmail = userProfile?.email || '';

        // Encontrar dados do pedido
        const order = orderData.find(o => o.id === usage.order_id);
        const orderTotal = order?.valor_total || 0;

        // Encontrar itens do pedido
        const relatedItems = orderItems.filter(item => item.order_id === usage.order_id);

        // Processar itens e extrair nomes de vendedores
        const vendorNames = new Set<string>();
        const processedItems = relatedItems.map(item => {
          const produto = item.produtos;
          if (produto?.vendedores?.nome_loja) {
            vendorNames.add(produto.vendedores.nome_loja);
          }
          
          return {
            id: item.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            produto: produto ? {
              nome: produto.nome,
              vendedor_id: produto.vendedor_id,
              vendedores: produto.vendedores
            } : undefined
          };
        });

        // Consolidar nome do vendedor
        const vendorNamesList = Array.from(vendorNames);
        const vendorDisplayName = vendorNamesList.length > 0 
          ? vendorNamesList.join(', ') 
          : 'Vendedor não identificado';

        console.log(`[useCouponUsage] Processing usage ${usage.id}:`, {
          userName,
          userEmail,
          orderTotal,
          vendorDisplayName,
          itemsCount: processedItems.length
        });

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

        return enrichedRecord;
      });

      console.log('[useCouponUsage] Final enriched usage data:', enrichedUsage);
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
