
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

interface FavoriteItem {
  id: string;
  user_id: string;
  produto_id: string;
  data_adicionado: string;
  produtos: Product;
}

export const useFavoritesData = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      try {
        console.log('Fetching favorites for user:', user?.id);
        
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user?.id || '');
        
        if (favoritesError) {
          console.error('Error fetching favorites:', favoritesError);
          throw favoritesError;
        }
        
        console.log('Raw favorites data:', favoritesData);
        
        if (!favoritesData || favoritesData.length === 0) {
          return [];
        }

        const productIds = favoritesData.map(item => item.produto_id);
        
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
        
        const result = favoritesData.map(favoriteItem => ({
          ...favoriteItem,
          produtos: productsData?.find(p => p.id === favoriteItem.produto_id) ? {
            ...productsData.find(p => p.id === favoriteItem.produto_id)!,
            loja_nome: productsData.find(p => p.id === favoriteItem.produto_id)?.vendedor_id 
              ? vendorMap[productsData.find(p => p.id === favoriteItem.produto_id)!.vendedor_id!] 
              : undefined
          } : null
        })).filter(item => item.produtos !== null);
        
        console.log('Processed favorites data:', result);
        return result as FavoriteItem[];
      } catch (error) {
        console.error('Error in favorites query:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });
};
