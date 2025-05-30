
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useCartAdd } from './use-cart-add';
import { addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '@/services/cart/cartItemOperations';

/**
 * Hook for cart operations with loading state management
 */
export function useCartOperations(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const { addToCart: addToCartHook, isLoading: isAddingToCart } = useCartAdd(refreshCartData);

  /**
   * Add an item to the cart
   */
  const handleAddToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      console.log(`[useCartOperations] Adding ${quantity} of ${productId} to cart`);
      setIsLoading(true);
      setOperationInProgress('add');
      
      await addToCart(productId, quantity);
      await refreshCartData();
      
      toast.success(`${quantity} ${quantity > 1 ? 'unidades' : 'unidade'} adicionada(s) ao carrinho`);
    } catch (error: any) {
      console.error('[useCartOperations] Error adding to cart:', error);
      toast.error(error.message || 'Erro ao adicionar ao carrinho');
      throw error;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  /**
   * Update the quantity of an item in the cart
   */
  const handleUpdateQuantity = async (itemId: string, newQuantity: number): Promise<void> => {
    try {
      if (newQuantity < 1) {
        console.log('[useCartOperations] Quantity must be at least 1');
        return;
      }
      
      console.log(`[useCartOperations] Updating quantity for ${itemId} to ${newQuantity}`);
      setIsLoading(true);
      setOperationInProgress('update');
      
      await updateCartItemQuantity(itemId, newQuantity);
      await refreshCartData();
    } catch (error: any) {
      console.error('[useCartOperations] Error updating quantity:', error);
      toast.error(error.message || 'Erro ao atualizar quantidade');
      throw error;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  /**
   * Remove an item from the cart
   */
  const handleRemoveItem = async (itemId: string): Promise<void> => {
    try {
      console.log(`[useCartOperations] Removing item ${itemId}`);
      setIsLoading(true);
      setOperationInProgress('remove');
      
      await removeFromCart(itemId);
      await refreshCartData();
      
      toast.success('Item removido do carrinho');
    } catch (error: any) {
      console.error('[useCartOperations] Error removing item:', error);
      toast.error(error.message || 'Erro ao remover item');
      throw error;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  /**
   * Clear all items from the cart
   */
  const handleClearCart = async (): Promise<void> => {
    try {
      console.log('[useCartOperations] Clearing cart');
      setIsLoading(true);
      setOperationInProgress('clear');
      
      await clearCart();
      
      // Force multiple refreshes to ensure state is updated
      console.log('[useCartOperations] First refresh after clear...');
      await refreshCartData();
      
      // Add a small delay and refresh again to handle any timing issues
      setTimeout(async () => {
        console.log('[useCartOperations] Second refresh after clear...');
        await refreshCartData();
      }, 100);
      
      toast.success('Carrinho esvaziado');
    } catch (error: any) {
      console.error('[useCartOperations] Error clearing cart:', error);
      toast.error(error.message || 'Erro ao esvaziar o carrinho');
      throw error;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  return {
    isLoading,
    isAddingToCart,
    operationInProgress,
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    clearCart: handleClearCart
  };
}
