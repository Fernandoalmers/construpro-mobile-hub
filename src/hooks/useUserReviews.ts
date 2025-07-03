import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserReview {
  id: string;
  produto_nome: string;
  produto_id: string;
  avaliacao: number;
  comentario: string;
  data_avaliacao: string;
  produto_imagem?: string;
}

export function useUserReviews() {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setReviews([]);
        return;
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select(`
          id,
          nota,
          comentario,
          data,
          produto_id
        `)
        .eq('cliente_id', user.id)
        .order('data', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching user reviews:', reviewsError);
        setError('Erro ao carregar avaliações');
        return;
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        return;
      }

      // Buscar informações dos produtos
      const productIds = reviewsData.map(review => review.produto_id);
      const { data: productsData, error: productsError } = await supabase
        .from('produtos')
        .select('id, nome, imagens')
        .in('id', productIds);

      if (productsError) {
        console.error('Error fetching products data:', productsError);
        // Continue sem os dados dos produtos
      }

      const formattedReviews: UserReview[] = reviewsData.map(review => {
        const product = productsData?.find(p => p.id === review.produto_id);
        const productImages = product?.imagens as string[] | null;
        const mainImage = productImages && productImages.length > 0 ? productImages[0] : undefined;

        // Debug log para verificar o valor original da nota
        console.log('[useUserReviews] Review data:', {
          id: review.id,
          produto_nome: product?.nome,
          nota_original: review.nota,
          nota_type: typeof review.nota
        });

        return {
          id: review.id,
          produto_nome: product?.nome || 'Produto não encontrado',
          produto_id: review.produto_id,
          avaliacao: Number(review.nota), // Garantir que é número
          comentario: review.comentario || '',
          data_avaliacao: review.data,
          produto_imagem: mainImage
        };
      });

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      setError('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReviews();
  }, []);

  return {
    reviews,
    loading,
    error,
    refetch: fetchUserReviews
  };
}