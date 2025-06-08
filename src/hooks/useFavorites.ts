
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  addToFavorites as addToFavoritesService, 
  removeFromFavorites as removeFromFavoritesService,
  isProductFavorited 
} from '@/services/favoriteService';
import { useQueryClient } from '@tanstack/react-query';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const addToFavorites = useCallback(async (productId: string) => {
    if (!isAuthenticated) return false;
    
    setIsLoading(true);
    try {
      const result = await addToFavoritesService(productId);
      if (result) {
        // Invalidate favorites queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['recentlyViewed'] });
        queryClient.invalidateQueries({ queryKey: ['frequentlyBought'] });
      }
      return result;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, queryClient]);

  const removeFromFavorites = useCallback(async (productId: string) => {
    if (!isAuthenticated) return false;
    
    setIsLoading(true);
    try {
      const result = await removeFromFavoritesService(productId);
      if (result) {
        // Invalidate favorites queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['recentlyViewed'] });
        queryClient.invalidateQueries({ queryKey: ['frequentlyBought'] });
      }
      return result;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, queryClient]);

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
