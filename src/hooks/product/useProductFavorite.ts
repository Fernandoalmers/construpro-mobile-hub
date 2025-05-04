
import { useState, useEffect } from 'react';
import { isProductFavorited } from '@/services/cartService';

export function useProductFavorite(productId: string | undefined, isAuthenticated: boolean) {
  const [isFavorited, setIsFavorited] = useState(false);
  
  useEffect(() => {
    if (!productId || !isAuthenticated) return;
    
    const checkFavoriteStatus = async () => {
      try {
        const favorited = await isProductFavorited(productId);
        setIsFavorited(favorited);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkFavoriteStatus();
  }, [productId, isAuthenticated]);
  
  return isFavorited;
}
