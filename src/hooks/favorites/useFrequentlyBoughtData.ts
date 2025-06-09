
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../context/AuthContext';

interface Product {
  id: string;
  nome: string;
  preco_normal: number;
  preco_promocional?: number;
  imagens: any;
  categoria: string;
  descricao: string;
  vendedor_id?: string;
  loja_nome?: string;
}

interface FrequentlyBoughtItem {
  produto_id: string;
  count: number;
  produtos: Product | null;
}

export const useFrequentlyBoughtData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['frequentlyBought'],
    queryFn: async () => {
      try {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('produto_id, quantidade')
          .eq('order_id', user?.id || '');
          
        if (orderItemsError) throw orderItemsError;
        
        if (orderItems && orderItems.length > 0) {
          const productMap: Record<string, number> = {};
          
          orderItems.forEach(item => {
            if (item.produto_id) {
              if (!productMap[item.produto_id]) {
                productMap[item.produto_id] = 0;
              }
              productMap[item.produto_id] += item.quantidade || 1;
            }
          });
          
          const aggregatedItems = Object.entries(productMap).map(([produto_id, count]) => ({
            produto_id,
            count
          }));
          
          const topItems = aggregatedItems
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
          
          const productIds = topItems.map(item => item.produto_id);
          
          if (productIds.length === 0) return [];
          
          const { data: products, error: productsError } = await supabase
            .from('produtos')
            .select('id, nome, preco_normal, preco_promocional, imagens, categoria, descricao, vendedor_id')
            .in('id', productIds);
          
          if (productsError) throw productsError;
          
          const enrichedItems = topItems.map(item => {
            const matchingProduct = (products || []).find(p => p.id === item.produto_id) || null;
            return {
              produto_id: item.produto_id,
              count: item.count,
              produtos: matchingProduct
            };
          }).filter(item => item.produtos !== null);
          
          const vendedorIds = enrichedItems
            .filter(item => item.produtos && item.produtos.vendedor_id)
            .map(item => item.produtos?.vendedor_id)
            .filter(Boolean) as string[];
          
          if (vendedorIds.length > 0) {
            const { data: vendedores, error: vendedoresError } = await supabase
              .from('vendedores')
              .select('id, nome_loja')
              .in('id', vendedorIds);
            
            if (!vendedoresError && vendedores) {
              const vendedorMap = Object.fromEntries(vendedores.map(v => [v.id, v.nome_loja]));
              
              return enrichedItems.map(item => ({
                ...item,
                produtos: item.produtos ? {
                  ...item.produtos,
                  loja_nome: item.produtos.vendedor_id ? vendedorMap[item.produtos.vendedor_id] : undefined
                } : null
              }));
            }
          }
          
          return enrichedItems;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching frequently bought products:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });
};
