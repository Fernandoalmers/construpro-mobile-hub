
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { addToCart as addToCartService } from '@/services/cart/operations/addToCart';

/**
 * Hook providing functionality to add items to cart
 */
export function useCartAdd(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  const [processingProducts, setProcessingProducts] = useState<Record<string, boolean>>({});

  // Add product to cart
  const addToCart = async (productId: string, quantity: number): Promise<boolean> => {
    try {
      console.log('[useCartAdd] adicionando', productId, 'qty:', quantity);
      
      if (!productId) {
        console.error('Invalid product ID provided to addToCart');
        throw new Error('ID do produto inválido');
      }
      
      setIsLoading(true);
      setProcessingProducts(prev => ({ ...prev, [productId]: true }));
      
      await addToCartService(productId, quantity);
      
      // Refresh cart data to update UI
      await refreshCartData();
      return true;
      
    } catch (error: any) {
      console.error('[useCartAdd] erro ao adicionar ao carrinho', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      // Return false to indicate failure
      return false;
    } finally {
      setIsLoading(false);
      setProcessingProducts(prev => ({ ...prev, [productId]: false }));
    }
  };
  
  return {
    isLoading,
    processingProducts,
    addToCart
  };
}
