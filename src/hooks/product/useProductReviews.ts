
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductReview {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  date: string;
}

export function useProductReviews(productId: string | undefined) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  
  const fetchReviews = async () => {
    if (!productId) return;
    
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select(`
          id,
          cliente_id,
          nota,
          comentario,
          data,
          profiles:cliente_id (nome)
        `)
        .eq('produto_id', productId)
        .order('data', { ascending: false });
      
      if (!reviewsError && reviewsData) {
        const formattedReviews = reviewsData.map(review => ({
          id: review.id,
          user_name: review.profiles?.nome || 'Usuário',
          rating: review.nota,
          comment: review.comentario,
          date: new Date(review.data).toLocaleDateString('pt-BR')
        }));
        
        setReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error fetching product reviews:', error);
    }
  };
  
  useEffect(() => {
    fetchReviews();
  }, [productId]);
  
  return { reviews, refetchReviews: fetchReviews };
}
