
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Cart } from '@/types/cart';
import * as cartApi from '@/services/cart';

export function useCartOperations(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Add product to cart
  const addToCart = async (productId: string, quantity: number): Promise<void> => {
    try {
      console.log('[useCartOperations] adicionando', productId, 'qty:', quantity);
      setIsLoading(true);

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
      
      return Promise.resolve();
    } catch (error) {
      console.error('[useCartOperations] erro ao adicionar ao carrinho', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId: string, newQuantity: number): Promise<void> => {
    try {
      setIsLoading(true);
      
      const updated = await cartApi.updateCartItemQuantity(cartItemId, newQuantity);
      if (!updated) {
        toast.error('Erro ao atualizar quantidade');
        return;
      }

      await refreshCartData();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (cartItemId: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const removed = await cartApi.removeFromCart(cartItemId);
      if (!removed) {
        toast.error('Erro ao remover item do carrinho');
        return;
      }

      await refreshCartData();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Erro ao remover item');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async (): Promise<void> => {
    const cart = await cartApi.getCart();
    if (!cart) return;

    try {
      setIsLoading(true);
      
      const cleared = await cartApi.clearCart();
      if (!cleared) {
        toast.error('Erro ao limpar o carrinho');
        return;
      }

      await refreshCartData();
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Erro ao limpar o carrinho');
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
