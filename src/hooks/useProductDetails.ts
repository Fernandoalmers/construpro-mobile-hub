
import { useEffect } from 'react';
import { Product } from '@/services/productService';
import { useProductFetch } from './product/useProductFetch';
import { trackProductView } from './product/useProductTracking';
import { useProductReviews, ProductReview } from './product/useProductReviews';
import { useProductFavorite } from './product/useProductFavorite';
import { useDeliveryEstimate } from './product/useDeliveryEstimate';

interface ProductDetailsState {
  product: Product | null;
  loading: boolean;
  error: string | null;
  isFavorited: boolean;
  reviews: ProductReview[];
  estimatedDelivery: {
    minDays: number;
    maxDays: number;
  };
}

export function useProductDetails(id: string | undefined, isAuthenticated: boolean): ProductDetailsState {
  // Use our separated hooks
  const { product, loading, error } = useProductFetch(id);
  const reviews = useProductReviews(id);
  const isFavorited = useProductFavorite(id, isAuthenticated);
  const estimatedDelivery = useDeliveryEstimate(product);
  
  // Track product view when authenticated
  useEffect(() => {
    if (id && isAuthenticated && product) {
      trackProductView(id);
    }
  }, [id, isAuthenticated, product]);
  
  // Return a composite state that matches the original interface
  return {
    product,
    loading,
    error,
    isFavorited,
    reviews,
    estimatedDelivery
  };
}
