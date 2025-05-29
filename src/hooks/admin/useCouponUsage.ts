
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

      // Step 2: Get unique user IDs and order IDs for batch fetching
      const userIds = [...new Set(usageRecords.map(record => record.user_id))];
      const orderIds = [...new Set(usageRecords.map(record => record.order_id).filter(Boolean))];

      // Step 3: Fetch user profiles in batch
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      // Step 4: Fetch orders in batch
      const { data: orders } = await supabase
        .from('orders')
        .select('id, valor_total')
        .in('id', orderIds);

      // Step 5: Fetch order items in batch
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      // Step 6: Get product IDs from order items
      const productIds = [...new Set((orderItems || []).map(item => item.produto_id))];

      // Step 7: Fetch products with vendor info
      const { data: products } = await supabase
        .from('produtos')
        .select('id, nome, vendedor_id')
        .in('id', productIds);

      // Step 8: Get vendor IDs and fetch vendor info
      const vendorIds = [...new Set((products || []).map(product => product.vendedor_id))];
      const { data: vendors } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .in('id', vendorIds);

      console.log('[useCouponUsage] Fetched data:', {
        profiles: profiles?.length || 0,
        orders: orders?.length || 0,
        orderItems: orderItems?.length || 0,
        products: products?.length || 0,
        vendors: vendors?.length || 0
      });

      // Step 9: Process and combine data
      const enrichedUsage: CouponUsageDetail[] = usageRecords.map(usage => {
        // Find user data
        const userData = profiles?.find(p => p.id === usage.user_id);
        
        // Find order data
        const orderData = orders?.find(o => o.id === usage.order_id);
        
        // Find order items for this order
        const orderItemsData = orderItems?.filter(item => item.order_id === usage.order_id) || [];
        
        // Extract vendor name from first available product
        let vendorName = 'Vendedor não identificado';
        
        if (orderItemsData.length > 0) {
          // Get first product to determine vendor
          const firstProduct = products?.find(p => p.id === orderItemsData[0].produto_id);
          if (firstProduct) {
            const vendor = vendors?.find(v => v.id === firstProduct.vendedor_id);
            if (vendor?.nome_loja) {
              vendorName = vendor.nome_loja;
            }
          }
        }

        // Process order items for display
        const processedOrderItems = orderItemsData.map(item => {
          const product = products?.find(p => p.id === item.produto_id);
          const vendor = product ? vendors?.find(v => v.id === product.vendedor_id) : null;
          
          return {
            id: item.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            produto: product ? {
              nome: product.nome,
              vendedor_id: product.vendedor_id,
              vendedores: vendor ? {
                nome_loja: vendor.nome_loja
              } : undefined
            } : undefined
          };
        });

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
