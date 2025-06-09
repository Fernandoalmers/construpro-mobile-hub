
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

interface RecentlyViewed {
  id: string;
  user_id: string;
  produto_id: string;
  data_visualizacao: string;
  produtos: Product;
}

export const useRecentlyViewedData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recentlyViewed'],
    queryFn: async () => {
      try {
        const { data: recentData, error: recentError } = await supabase
          .from('recently_viewed')
          .select('*')
          .eq('user_id', user?.id || '')
          .order('data_visualizacao', { ascending: false })
          .limit(10);
        
        if (recentError) {
          console.error('Error fetching recently viewed:', recentError);
          throw recentError;
        }
        
        if (!recentData || recentData.length === 0) {
          return [];
        }

        const productIds = recentData.map(item => item.produto_id);
        
        const { data: productsData, error: productsError } = await supabase
          .from('produtos')
          .select('id, nome, preco_normal, preco_promocional, imagens, categoria, descricao, vendedor_id')
          .in('id', productIds);
        
        if (productsError) {
          console.error('Error fetching products:', productsError);
          throw productsError;
        }
        
        const vendorIds = (productsData || [])
          .map(p => p.vendedor_id)
          .filter(Boolean);
        
        let vendorMap: Record<string, string> = {};
        if (vendorIds.length > 0) {
          const { data: vendedores, error: vendedoresError } = await supabase
            .from('vendedores')
            .select('id, nome_loja')
            .in('id', vendorIds);
          
          if (!vendedoresError && vendedores) {
            vendorMap = Object.fromEntries(vendedores.map(v => [v.id, v.nome_loja]));
          }
        }
        
        return recentData.map(recentItem => ({
          ...recentItem,
          produtos: productsData?.find(p => p.id === recentItem.produto_id) ? {
            ...productsData.find(p => p.id === recentItem.produto_id)!,
            loja_nome: productsData.find(p => p.id === recentItem.produto_id)?.vendedor_id 
              ? vendorMap[productsData.find(p => p.id === recentItem.produto_id)!.vendedor_id!] 
              : undefined
          } : null
        })).filter(item => item.produtos !== null) as RecentlyViewed[];
      } catch (error) {
        console.error('Error in recentlyViewed query:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });
};
