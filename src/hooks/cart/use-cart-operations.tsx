
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '@/services/cart/cartItemOperations';

/**
 * Hook for cart operations - optimized to prevent loops and ensure immediate counter updates
 */
export function useCartOperations(refreshCartData: () => Promise<void>, forceUpdate?: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  const handleAddToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      setIsLoading(true);
      setOperationInProgress(productId);
      
      console.log('[useCartOperations] Adding to cart:', { productId, quantity });
      await addToCart(productId, quantity);
      
      console.log('[useCartOperations] Refreshing cart after add');
      await refreshCartData();
      
      // Force immediate update
      if (forceUpdate) {
        forceUpdate();
      }
      
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

  const handleUpdateQuantity = async (itemId: string, newQuantity: number): Promise<void> => {
    try {
      if (newQuantity < 1) return;
      
      setIsLoading(true);
      setOperationInProgress(itemId);
      
      console.log('[useCartOperations] Updating quantity:', { itemId, newQuantity });
      await updateCartItemQuantity(itemId, newQuantity);
      
      console.log('[useCartOperations] Refreshing cart after update');
      await refreshCartData();
      
      // Force immediate update
      if (forceUpdate) {
        forceUpdate();
      }
    } catch (error: any) {
      console.error('[useCartOperations] Error updating quantity:', error);
      toast.error(error.message || 'Erro ao atualizar quantidade');
      throw error;
    } finally {
      setIsLoading(false);
      setOperationInProgress(null);
    }
  };

  const handleRemoveItem = async (itemId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setOperationInProgress(itemId);
      
      console.log('[useCartOperations] Removing item:', itemId);
      await removeFromCart(itemId);
      
      console.log('[useCartOperations] Refreshing cart after remove');
      await refreshCartData();
      
      // Force immediate update for counter
      if (forceUpdate) {
        console.log('[useCartOperations] Forcing immediate update after remove');
        forceUpdate();
      }
      
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

  const handleClearCart = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setOperationInProgress('clear-cart');
      
      console.log('[useCartOperations] Clearing cart');
      await clearCart();
      
      console.log('[useCartOperations] Refreshing cart after clear');
      await refreshCartData();
      
      // Force immediate update for counter
      if (forceUpdate) {
        console.log('[useCartOperations] Forcing immediate update after clear');
        forceUpdate();
      }
      
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
