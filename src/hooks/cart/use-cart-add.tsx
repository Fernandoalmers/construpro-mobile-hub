
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { addToCart as addToCartService } from '@/services/cart/operations/addToCart';

/**
 * Hook providing functionality to add items to cart
 */
export function useCartAdd(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Add product to cart
  const addToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      console.log('[useCartAdd] adicionando', productId, 'qty:', quantity);
      
      if (!productId) {
        console.error('Invalid product ID provided to addToCart');
        throw new Error('ID do produto inválido');
      }
      
      setIsLoading(true);
      
      await addToCartService(productId, quantity);
      
      // Refresh cart data to update UI
      await refreshCartData();
      
    } catch (error: any) {
      console.error('[useCartAdd] erro ao adicionar ao carrinho', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    addToCart
  };
}
