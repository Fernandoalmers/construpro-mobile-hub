
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { Cart } from '@/types/cart';
import * as cartApi from '@/services/cart';

export function useCartData(isAuthenticated: boolean, userId: string | null) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh cart data
  const refreshCart = async (): Promise<void> => {
    if (!userId) {
      console.log('Cannot refresh cart: user not available');
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Refreshing cart for user:', userId);
      setIsLoading(true);
      // Directly use getCart from cartOperations to ensure we're getting the latest data
      const cartData = await cartApi.getCart();
      
      console.log('Cart data retrieved:', cartData);
      setCart(cartData);
      
      // Save to localStorage for CartPopup to use if context is unavailable
      if (cartData) {
        try {
          localStorage.setItem('cartData', JSON.stringify({
            id: cartData.id,
            summary: cartData.summary
          }));
        } catch (err) {
          console.warn('Could not save cart to localStorage:', err);
        }
      }
    } catch (error) {
      console.error('Error in refreshCart:', error);
      toast.error('Erro ao atualizar o carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log('User authenticated, refreshing cart');
      refreshCart();
    } else {
      console.log('User not authenticated, clearing cart');
      setCart(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, userId]);

  return {
    cart,
    isLoading,
    refreshCart,
    setIsLoading
  };
}
