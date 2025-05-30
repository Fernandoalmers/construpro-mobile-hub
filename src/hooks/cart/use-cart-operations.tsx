
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { addToCart, updateCartItemQuantity, removeFromCart, clearCart } from '@/services/cart/cartItemOperations';

/**
 * Hook for cart operations - ultra simplified to prevent loops
 */
export function useCartOperations(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);

  const handleAddToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      setIsLoading(true);
      setOperationInProgress(productId);
      
      await addToCart(productId, quantity);
      await refreshCartData();
      
      toast.success(`${quantity} ${quantity > 1 ? 'unidades' : 'unidade'} adicionada(s) ao carrinho`);
    } catch (error: any) {
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
      
      await updateCartItemQuantity(itemId, newQuantity);
      await refreshCartData();
    } catch (error: any) {
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
      
      await removeFromCart(itemId);
      await refreshCartData();
      
      toast.success('Item removido do carrinho');
    } catch (error: any) {
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
      
      await clearCart();
      await refreshCartData();
      
      toast.success('Carrinho esvaziado');
    } catch (error: any) {
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
