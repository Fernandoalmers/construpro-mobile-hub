
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
      
      // Buscar todos os usos do cupom
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

      if (!usage || usage.length === 0) {
        setUsageData([]);
        return;
      }

      // Para cada uso, buscar informações completas
      const enrichedUsage = await Promise.all(usage.map(async (use) => {
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
        let orderTotal = 0;
        let vendorNames: string[] = [];
        
        if (use.order_id) {
          // Buscar informações do pedido
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('valor_total')
            .eq('id', use.order_id)
            .single();

          if (!orderError && orderData) {
            orderTotal = orderData.valor_total;
          }

          // Buscar itens do pedido primeiro
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              id,
              produto_id,
              quantidade,
              preco_unitario,
              subtotal
            `)
            .eq('order_id', use.order_id);

          if (itemsError) {
            console.error('[useCouponUsage] Error fetching order items:', itemsError);
          } else if (items) {
            // Para cada item, buscar informações do produto e vendedor
            const enrichedItems = await Promise.all(items.map(async (item) => {
              const { data: produto, error: produtoError } = await supabase
                .from('produtos')
                .select(`
                  nome,
                  vendedor_id
                `)
                .eq('id', item.produto_id)
                .single();

              if (produtoError) {
                console.error('[useCouponUsage] Error fetching product:', produtoError);
                return {
                  ...item,
                  produto: null
                };
              }

              let vendedorInfo = null;
              if (produto?.vendedor_id) {
                const { data: vendedor, error: vendedorError } = await supabase
                  .from('vendedores')
                  .select('nome_loja')
                  .eq('id', produto.vendedor_id)
                  .single();

                if (!vendedorError && vendedor) {
                  vendedorInfo = { nome_loja: vendedor.nome_loja };
                }
              }

              return {
                ...item,
                produto: {
                  ...produto,
                  vendedores: vendedorInfo
                }
              };
            }));

            orderItems = enrichedItems;
            
            // Extrair nomes únicos dos vendedores
            const uniqueVendors = new Set<string>();
            enrichedItems.forEach(item => {
              if (item.produto?.vendedores?.nome_loja) {
                uniqueVendors.add(item.produto.vendedores.nome_loja);
              }
            });
            vendorNames = Array.from(uniqueVendors);
          }
        }

        return {
          ...use,
          user_name: userProfile?.nome || 'Usuário não encontrado',
          user_email: userProfile?.email || '',
          order_total: orderTotal,
          vendor_name: vendorNames.length > 0 ? vendorNames.join(', ') : 'Vendedor não encontrado',
          store_name: vendorNames.length > 0 ? vendorNames.join(', ') : 'Loja não encontrada',
          order_items: orderItems
        };
      }));

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
