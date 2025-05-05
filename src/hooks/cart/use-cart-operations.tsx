
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Cart } from '@/types/cart';
import * as cartApi from '@/services/cart';

export function useCartOperations(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Add product to cart
  const addToCart = async (productId: string, quantity: number): Promise<void> => {
    console.log('[useCartOperations] adicionando', productId, 'qty:', quantity);
    setIsLoading(true);
    
    try {
      // Get the product price
      const product = await cartApi.fetchProductInfo(productId);
      if (!product) {
        console.error('Product not found:', productId);
        throw new Error('Produto não encontrado');
      }

      console.log('Product info:', product);

      if (product.estoque < quantity) {
        console.log('Not enough stock:', { available: product.estoque, requested: quantity });
        throw new Error('Quantidade solicitada não disponível em estoque');
      }

      // Get or create a cart
      const cart = await cartApi.getCart();
      
      console.log('Current cart:', cart);
      
      // Call the addToCart function from cartApi
      await cartApi.addToCart(productId, quantity);
      console.log('Product successfully added to cart');

      // Refresh cart data to update UI
      await refreshCartData();
      console.log('Cart data refreshed after adding product');
      
    } catch (error) {
      console.error('[useCartOperations] erro ao adicionar ao carrinho', error);
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity - ensure we catch any errors
  const updateQuantity = async (cartItemId: string, newQuantity: number): Promise<void> => {
    try {
      setIsLoading(true);
      
      const updated = await cartApi.updateCartItemQuantity(cartItemId, newQuantity);
      if (!updated) {
        throw new Error('Erro ao atualizar quantidade');
      }

      await refreshCartData();
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade: ' + (error.message || ''));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart - ensure we catch any errors
  const removeItem = async (cartItemId: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const removed = await cartApi.removeFromCart(cartItemId);
      if (!removed) {
        throw new Error('Erro ao remover item do carrinho');
      }

      await refreshCartData();
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error('Erro ao remover item: ' + (error.message || ''));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart - ensure we catch any errors
  const clearCart = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const cart = await cartApi.getCart();
      if (!cart) return;
      
      const cleared = await cartApi.clearCart();
      if (!cleared) {
        throw new Error('Erro ao limpar o carrinho');
      }

      await refreshCartData();
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast.error('Erro ao limpar o carrinho: ' + (error.message || ''));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    setIsLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart
  };
}
