
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { useCartAdd } from './use-cart-add';
import { addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '@/services/cart/cartItemOperations';

/**
 * Hook for cart operations with improved synchronization
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
      console.log('[useCartOperations] Item added, refreshing cart data...');
      await refreshCartData();
      console.log('[useCartOperations] Cart data refreshed after add');
      
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
      console.log('[useCartOperations] Quantity updated, refreshing cart data...');
      await refreshCartData();
      console.log('[useCartOperations] Cart data refreshed after quantity update');
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
   * Remove an item from the cart - simplified with single refresh
   */
  const handleRemoveItem = async (itemId: string): Promise<void> => {
    try {
      console.log(`[useCartOperations] Removing item ${itemId}`);
      setIsLoading(true);
      setOperationInProgress('remove');
      
      await removeFromCart(itemId);
      console.log('[useCartOperations] Item removed, refreshing cart data...');
      
      // Single refresh with forced update
      await refreshCartData();
      console.log('[useCartOperations] Cart data refreshed after remove');
      
      // Force a small delay to ensure state propagation
      setTimeout(() => {
        console.log('[useCartOperations] Secondary refresh for UI consistency');
        refreshCartData().catch(err => console.warn('Secondary refresh failed:', err));
      }, 100);
      
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
   * Clear all items from the cart - simplified with single refresh
   */
  const handleClearCart = async (): Promise<void> => {
    try {
      console.log('[useCartOperations] Clearing cart');
      setIsLoading(true);
      setOperationInProgress('clear');
      
      await clearCart();
      
      // Single refresh with forced update
      console.log('[useCartOperations] Cart cleared, refreshing data...');
      await refreshCartData();
      
      // Force a small delay to ensure state propagation
      setTimeout(() => {
        console.log('[useCartOperations] Secondary refresh after clear');
        refreshCartData().catch(err => console.warn('Secondary refresh failed:', err));
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
