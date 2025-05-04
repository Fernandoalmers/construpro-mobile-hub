
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getProductById, Product, trackProductView } from '@/services/productService';
import { isProductFavorited } from '@/services/cartService';

interface ProductDetailsState {
  product: Product | null;
  loading: boolean;
  error: string | null;
  isFavorited: boolean;
  reviews: any[];
}

export function useProductDetails(id: string | undefined, isAuthenticated: boolean) {
  const [state, setState] = useState<ProductDetailsState>({
    product: null,
    loading: true,
    error: null,
    isFavorited: false,
    reviews: []
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const productData = await getProductById(id);
        
        if (!productData) {
          setState(prev => ({ ...prev, error: 'Produto não encontrado', loading: false }));
          return;
        }
        
        setState(prev => ({ ...prev, product: productData }));
        
        // Track product view
        if (isAuthenticated) {
          trackProductView(id);
        }
        
        // Check if favorited
        if (isAuthenticated) {
          const favorited = await isProductFavorited(id);
          setState(prev => ({ ...prev, isFavorited: favorited }));
        }
        
        // Fetch reviews for the product
        const { data: reviewsData } = await supabase
          .from('product_reviews')
          .select(`
            id,
            cliente_id,
            nota,
            comentario,
            data,
            profiles:cliente_id (nome)
          `)
          .eq('produto_id', id)
          .order('data', { ascending: false });
        
        if (reviewsData) {
          const formattedReviews = reviewsData.map(review => ({
            id: review.id,
            user_name: review.profiles?.nome || 'Usuário',
            rating: review.nota,
            comment: review.comentario,
            date: new Date(review.data).toLocaleDateString('pt-BR')
          }));
          
          setState(prev => ({ ...prev, reviews: formattedReviews, loading: false }));
        } else {
          setState(prev => ({ ...prev, reviews: [], loading: false }));
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setState(prev => ({ ...prev, error: 'Erro ao carregar detalhes do produto', loading: false }));
      }
    };
    
    fetchProduct();
  }, [id, isAuthenticated]);

  return state;
}
