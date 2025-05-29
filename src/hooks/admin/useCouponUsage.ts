
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
      
      // Usar consulta SQL direta com LEFT JOINs para garantir que sempre retorne dados
      const { data: usageRecordsRaw, error: usageError } = await supabase
        .rpc('execute_custom_sql', {
          sql_statement: `
            SELECT 
              cu.id, 
              cu.coupon_id, 
              cu.user_id, 
              cu.order_id, 
              cu.discount_amount, 
              cu.used_at,
              p.nome AS user_name, 
              p.email AS user_email,
              o.valor_total,
              v.nome_loja AS vendor_name,
              oi.id AS item_id,
              oi.produto_id,
              oi.quantidade,
              oi.preco_unitario,
              oi.subtotal,
              pr.nome AS produto_nome
            FROM coupon_usage cu
            LEFT JOIN profiles p ON cu.user_id = p.id
            LEFT JOIN orders o ON cu.order_id = o.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN produtos pr ON oi.produto_id = pr.id
            LEFT JOIN vendedores v ON pr.vendedor_id = v.id
            WHERE cu.coupon_id = '${id}'
            ORDER BY cu.used_at DESC
          `
        });

      if (usageError) {
        console.error('[useCouponUsage] Error fetching usage:', usageError);
        toast.error('Erro ao carregar histórico de uso do cupom');
        return;
      }

      // Type cast the result to array and check if it exists
      const usageRecords = Array.isArray(usageRecordsRaw) ? usageRecordsRaw : [];

      if (usageRecords.length === 0) {
        console.log('[useCouponUsage] No usage found for coupon:', id);
        setUsageData([]);
        return;
      }

      console.log('[useCouponUsage] Raw usage records:', usageRecords);

      // Agrupar os resultados por order_id e consolidar vendedores
      const groupedUsage = new Map<string, any>();

      usageRecords.forEach((record: any) => {
        const usageId = record.id;
        
        if (!groupedUsage.has(usageId)) {
          groupedUsage.set(usageId, {
            id: record.id,
            coupon_id: record.coupon_id,
            user_id: record.user_id,
            order_id: record.order_id,
            discount_amount: record.discount_amount,
            used_at: record.used_at,
            user_name: record.user_name || 'Usuário não encontrado',
            user_email: record.user_email || '',
            order_total: record.valor_total || 0,
            vendors: new Set<string>(),
            order_items: []
          });
        }

        const usage = groupedUsage.get(usageId);
        
        // Adicionar vendedor ao conjunto (evita duplicatas)
        if (record.vendor_name) {
          usage.vendors.add(record.vendor_name);
        }
        
        // Adicionar item do pedido se existir
        if (record.item_id) {
          const existingItem = usage.order_items.find((item: any) => item.id === record.item_id);
          if (!existingItem) {
            usage.order_items.push({
              id: record.item_id,
              produto_id: record.produto_id,
              quantidade: record.quantidade,
              preco_unitario: record.preco_unitario,
              subtotal: record.subtotal,
              produto: record.produto_nome ? {
                nome: record.produto_nome,
                vendedor_id: record.produto_id // Usando produto_id como placeholder
              } : undefined
            });
          }
        }
      });

      // Converter os dados agrupados para o formato final
      const enrichedUsage: CouponUsageDetail[] = Array.from(groupedUsage.values()).map(usage => {
        // Consolidar nomes dos vendedores
        const vendorNamesList = Array.from(usage.vendors);
        const vendorDisplayName = vendorNamesList.length > 0 
          ? vendorNamesList.join(', ') 
          : 'Vendedor não identificado';

        console.log(`[useCouponUsage] Found vendors for usage ${usage.id}:`, vendorNamesList);

        const enrichedRecord: CouponUsageDetail = {
          id: usage.id,
          coupon_id: usage.coupon_id,
          user_id: usage.user_id,
          order_id: usage.order_id,
          discount_amount: usage.discount_amount,
          used_at: usage.used_at,
          user_name: usage.user_name,
          user_email: usage.user_email,
          order_total: usage.order_total,
          vendor_name: vendorDisplayName,
          store_name: vendorDisplayName,
          order_items: usage.order_items
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
