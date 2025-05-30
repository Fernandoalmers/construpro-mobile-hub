
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { useCartAdd } from './use-cart-add';
import { addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '@/services/cart/cartItemOperations';

/**
 * Hook for cart operations with loading state management and immediate UI updates
 */
export function useCartOperations(
  refreshCartData: () => Promise<void>, 
  onCartCleared?: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const { addToCart: addToCartHook, isLoading: isAddingToCart } = useCartAdd(refreshCartData);

  /**
   * Add an item to the cart with immediate UI feedback
   */
  const handleAddToCart = useCallback(async (productId: string, quantity: number): Promise<void> => {
    try {
      console.log(`[useCartOperations] Adding ${quantity} of ${productId} to cart`);
      setIsLoading(true);
      setOperationInProgress('add');
      
      await addToCart(productId, quantity);
      
      // Immediate refresh for UI consistency
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
  }, [refreshCartData]);

  /**
   * Update the quantity of an item in the cart with immediate UI feedback
   */
  const handleUpdateQuantity = useCallback(async (itemId: string, newQuantity: number): Promise<void> => {
    try {
      if (newQuantity < 1) {
        console.log('[useCartOperations] Quantity must be at least 1');
        return;
      }
      
      console.log(`[useCartOperations] Updating quantity for ${itemId} to ${newQuantity}`);
      setIsLoading(true);
      setOperationInProgress('update');
      
      await updateCartItemQuantity(itemId, newQuantity);
      
      // Immediate refresh for UI consistency
      await refreshCartData();
    } catch (error: any) {
      console.error('[useCartOperations] Error updating quantity:', error);
      toast.error(error.message || 'Erro ao atualizar quantidade');
      throw error;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  }, [refreshCartData]);

  /**
   * Remove an item from the cart with immediate UI feedback
   */
  const handleRemoveItem = useCallback(async (itemId: string): Promise<void> => {
    try {
      console.log(`[useCartOperations] Removing item ${itemId}`);
      setIsLoading(true);
      setOperationInProgress('remove');
      
      await removeFromCart(itemId);
      
      // Immediate refresh for UI consistency
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
  }, [refreshCartData]);

  /**
   * Clear all items from the cart with immediate UI feedback
   */
  const handleClearCart = useCallback(async (): Promise<void> => {
    try {
      console.log('[useCartOperations] Clearing cart');
      setIsLoading(true);
      setOperationInProgress('clear');
      
      // Notify UI immediately that cart is being cleared
      if (onCartCleared) {
        onCartCleared();
      }
      
      await clearCart();
      
      // Force immediate refresh to ensure empty state
      console.log('[useCartOperations] Refreshing cart after clear...');
      await refreshCartData();
      
      toast.success('Carrinho esvaziado');
    } catch (error: any) {
      console.error('[useCartOperations] Error clearing cart:', error);
      toast.error(error.message || 'Erro ao esvaziar o carrinho');
      throw error;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  }, [refreshCartData, onCartCleared]);

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
