
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  addToFavorites as addToFavoritesService, 
  removeFromFavorites as removeFromFavoritesService,
  isProductFavorited 
} from '@/services/favoriteService';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const addToFavorites = useCallback(async (productId: string) => {
    if (!isAuthenticated) return false;
    
    setIsLoading(true);
    try {
      const result = await addToFavoritesService(productId);
      return result;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const removeFromFavorites = useCallback(async (productId: string) => {
    if (!isAuthenticated) return false;
    
    setIsLoading(true);
    try {
      const result = await removeFromFavoritesService(productId);
      return result;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const isFavorite = useCallback(async (productId: string) => {
    if (!isAuthenticated) return false;
    
    try {
      return await isProductFavorited(productId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }, [isAuthenticated]);

  return {
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    isLoading
  };
}
