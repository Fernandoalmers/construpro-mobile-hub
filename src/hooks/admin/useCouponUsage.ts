
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
      
      // Step 1: Fetch coupon usage records
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

      // Step 2: Get unique user IDs and order IDs
      const userIds = [...new Set(usageRecords.map(record => record.user_id))];
      const orderIds = [...new Set(usageRecords.map(record => record.order_id).filter(Boolean))];

      // Step 3: Fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      // Step 4: Fetch orders with their items and vendor info
      const { data: orders } = await supabase
        .from('orders')
        .select('id, valor_total')
        .in('id', orderIds);

      // Step 5: Fetch order items with product and vendor info
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          produtos:produto_id (
            id,
            nome,
            vendedor_id,
            vendedores:vendedor_id (
              id,
              nome_loja
            )
          )
        `)
        .in('order_id', orderIds);

      console.log('[useCouponUsage] Fetched profiles:', profiles);
      console.log('[useCouponUsage] Fetched orders:', orders);
      console.log('[useCouponUsage] Fetched order items:', orderItems);

      // Step 6: Process and combine data
      const enrichedUsage: CouponUsageDetail[] = usageRecords.map(usage => {
        // Find user data
        const userData = profiles?.find(p => p.id === usage.user_id);
        
        // Find order data
        const orderData = orders?.find(o => o.id === usage.order_id);
        
        // Find order items for this order
        const orderItemsData = orderItems?.filter(item => item.order_id === usage.order_id) || [];
        
        // Extract vendor name from first item with vendor data
        let vendorName = 'Vendedor não identificado';
        
        if (orderItemsData.length > 0) {
          const firstItemWithVendor = orderItemsData.find(item => 
            item.produtos?.vendedores?.nome_loja
          );
          
          if (firstItemWithVendor?.produtos?.vendedores?.nome_loja) {
            vendorName = firstItemWithVendor.produtos.vendedores.nome_loja;
          }
        }

        // Process order items for display
        const processedOrderItems = orderItemsData.map(item => ({
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
            } : undefined
          } : undefined
        }));

        console.log(`[useCouponUsage] Processing usage ${usage.id}:`, {
          orderId: usage.order_id,
          extractedVendorName: vendorName,
          hasOrderItems: processedOrderItems.length > 0,
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
          order_items: processedOrderItems
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
