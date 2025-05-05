
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Cart } from '@/types/cart';
import * as cartApi from '@/services/cart';

export function useCartOperations(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(true);

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
      let cartId;
      
      if (cart) {
        cartId = cart.id;
        console.log('Using existing cart:', cartId);
        
        // Check if product already exists in cart
        const existingItem = await cartApi.findCartItem(cartId, productId);

        if (existingItem) {
          // Update existing item
          console.log('Product exists in cart, updating quantity:', existingItem);
          const newQuantity = existingItem.quantity + quantity;
          
          if (product.estoque < newQuantity) {
            console.log('Combined quantity exceeds stock:', { available: product.estoque, requested: newQuantity });
            throw new Error('Quantidade solicitada excede o estoque disponível');
          }
          
          const updated = await cartApi.updateItemQuantity(existingItem.id, newQuantity);
          if (!updated) {
            console.error('Failed to update cart item');
            throw new Error('Erro ao atualizar o carrinho');
          }
        } else {
          // Add new item
          try {
            // Use the correct price property - either preco_promocional or preco_normal
            const productPrice = product.preco_promocional || product.preco_normal;
            const added = await cartApi.addItemToCart(cartId, productId, quantity, productPrice);
            if (!added) {
              console.error('[useCartOperations] erro ao adicionar ao carrinho');
              throw new Error('Erro ao adicionar ao carrinho');
            }
          } catch (error) {
            console.error('[useCartOperations] erro ao adicionar ao carrinho', error);
            throw error;
          }
        }
      } else {
        // This case should not happen after our cart consolidation improvements
        // but keeping it as a fallback
        console.log('No cart found, creating new cart');
        
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('Usuário não identificado');
        }
        
        cartId = await cartApi.createCart(userId);
        if (!cartId) {
          console.error('Failed to create cart');
          throw new Error('Erro ao criar o carrinho');
        }
        console.log('New cart created:', cartId);
        
        // Add new item to cart
        // Use the correct price property - either preco_promocional or preco_normal
        const productPrice = product.preco_promocional || product.preco_normal;
        console.log('Adding new item to cart:', { cartId, productId, quantity, price: productPrice });
        try {
          const added = await cartApi.addItemToCart(cartId, productId, quantity, productPrice);
          if (!added) {
            console.error('[useCartOperations] erro ao adicionar ao carrinho');
            throw new Error('Erro ao adicionar ao carrinho');
          }
        } catch (error) {
          console.error('[useCartOperations] erro ao adicionar ao carrinho', error);
          throw error;
        }
      }

      await refreshCartData();
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
      
      const updated = await cartApi.updateItemQuantity(cartItemId, newQuantity);
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
      
      const removed = await cartApi.removeCartItem(cartItemId);
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
      
      const cleared = await cartApi.clearCartItems(cart.id);
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
