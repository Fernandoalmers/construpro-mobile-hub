
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
  const handleAddToCart = async (productId: string, quantity: number) => {
    try {
      console.log(`[useCartOperations] Adding ${quantity} of ${productId} to cart`);
      setIsLoading(true);
      setOperationInProgress('add');
      
      await addToCart(productId, quantity);
      await refreshCartData();
      
      toast.success(`${quantity} ${quantity > 1 ? 'unidades' : 'unidade'} adicionada(s) ao carrinho`);
      return true;
    } catch (error: any) {
      console.error('[useCartOperations] Error adding to cart:', error);
      toast.error(error.message || 'Erro ao adicionar ao carrinho');
      return false;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  /**
   * Update the quantity of an item in the cart
   */
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) {
        console.log('[useCartOperations] Quantity must be at least 1');
        return false;
      }
      
      console.log(`[useCartOperations] Updating quantity for ${itemId} to ${newQuantity}`);
      setIsLoading(true);
      setOperationInProgress('update');
      
      await updateCartItemQuantity(itemId, newQuantity);
      await refreshCartData();
      
      return true;
    } catch (error: any) {
      console.error('[useCartOperations] Error updating quantity:', error);
      toast.error(error.message || 'Erro ao atualizar quantidade');
      return false;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  /**
   * Remove an item from the cart
   */
  const handleRemoveItem = async (itemId: string) => {
    try {
      console.log(`[useCartOperations] Removing item ${itemId}`);
      setIsLoading(true);
      setOperationInProgress('remove');
      
      await removeFromCart(itemId);
      await refreshCartData();
      
      toast.success('Item removido do carrinho');
      return true;
    } catch (error: any) {
      console.error('[useCartOperations] Error removing item:', error);
      toast.error(error.message || 'Erro ao remover item');
      return false;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  /**
   * Clear all items from the cart
   */
  const handleClearCart = async () => {
    try {
      console.log('[useCartOperations] Clearing cart');
      setIsLoading(true);
      setOperationInProgress('clear');
      
      await clearCart();
      await refreshCartData();
      
      toast.success('Carrinho esvaziado');
      return true;
    } catch (error: any) {
      console.error('[useCartOperations] Error clearing cart:', error);
      toast.error(error.message || 'Erro ao esvaziar o carrinho');
      return false;
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
