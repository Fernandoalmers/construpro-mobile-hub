
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '@/services/cart/cartItemOperations';

/**
 * Hook for cart operations - simplified version
 */
export function useCartOperations(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  /**
   * Add an item to the cart
   */
  const handleAddToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      console.log(`[useCartOperations] Adding ${quantity} of ${productId} to cart`);
      setIsLoading(true);
      setOperationInProgress(productId);
      
      await addToCart(productId, quantity);
      console.log('[useCartOperations] Item added, refreshing cart data...');
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
      setOperationInProgress(itemId);
      
      await updateCartItemQuantity(itemId, newQuantity);
      console.log('[useCartOperations] Quantity updated, refreshing cart data...');
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
      setOperationInProgress(itemId);
      
      await removeFromCart(itemId);
      console.log('[useCartOperations] Item removed, refreshing cart data...');
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
      setOperationInProgress('clear-cart');
      
      await clearCart();
      console.log('[useCartOperations] Cart cleared, refreshing data...');
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
  };

  return {
    isLoading,
    operationInProgress,
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    clearCart: handleClearCart
  };
}
