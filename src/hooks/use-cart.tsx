
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { Cart, CartContextType } from '@/types/cart';
import * as cartApi from '@/services/cartApiService';

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User authenticated, refreshing cart');
      refreshCart();
    } else {
      console.log('User not authenticated, clearing cart');
      setCart(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Get current cart
  const refreshCart = async (): Promise<void> => {
    if (!user) {
      console.log('Cannot refresh cart: user not available');
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Refreshing cart for user:', user.id);
      setIsLoading(true);
      const cartData = await cartApi.fetchCart(user.id);
      console.log('Cart data retrieved:', cartData);
      setCart(cartData);
    } catch (error) {
      console.error('Error in refreshCart:', error);
      toast.error('Erro ao atualizar o carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  // Add product to cart
  const addToCart = async (productId: string, quantity: number): Promise<void> => {
    if (!user) {
      console.log('Cannot add to cart: user not authenticated');
      toast.error('Faça login para adicionar produtos ao carrinho');
      return;
    }

    try {
      console.log('Adding to cart:', { productId, quantity });
      setIsLoading(true);

      // Get the product price
      const product = await cartApi.fetchProductInfo(productId);
      if (!product) {
        console.error('Product not found:', productId);
        toast.error('Produto não encontrado');
        return;
      }

      console.log('Product info:', product);

      if (product.estoque < quantity) {
        console.log('Not enough stock:', { available: product.estoque, requested: quantity });
        toast.error('Quantidade solicitada não disponível em estoque');
        return;
      }

      // Get or create a cart
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
            toast.error('Quantidade solicitada excede o estoque disponível');
            return;
          }
          
          const updated = await cartApi.updateItemQuantity(existingItem.id, newQuantity);
          if (!updated) {
            console.error('Failed to update cart item');
            toast.error('Erro ao atualizar o carrinho');
            return;
          }
          
          await refreshCart();
          return;
        }
      } else {
        // Create new cart
        console.log('Creating new cart for user:', user.id);
        cartId = await cartApi.createCart(user.id);
        if (!cartId) {
          console.error('Failed to create cart');
          toast.error('Erro ao criar o carrinho');
          return;
        }
        console.log('New cart created:', cartId);
      }

      // Add new item to cart
      console.log('Adding new item to cart:', { cartId, productId, quantity, price: product.preco });
      const added = await cartApi.addItemToCart(cartId, productId, quantity, product.preco);
      if (!added) {
        console.error('Failed to add item to cart');
        toast.error('Erro ao adicionar ao carrinho');
        return;
      }

      await refreshCart();
      toast.success('Produto adicionado ao carrinho');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId: string, newQuantity: number): Promise<void> => {
    if (!cart) return;

    try {
      setIsLoading(true);
      
      const updated = await cartApi.updateItemQuantity(cartItemId, newQuantity);
      if (!updated) {
        toast.error('Erro ao atualizar quantidade');
        return;
      }

      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (cartItemId: string): Promise<void> => {
    if (!cart) return;

    try {
      setIsLoading(true);
      
      const removed = await cartApi.removeCartItem(cartItemId);
      if (!removed) {
        toast.error('Erro ao remover item do carrinho');
        return;
      }

      await refreshCart();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Erro ao remover item');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async (): Promise<void> => {
    if (!cart) return;

    try {
      setIsLoading(true);
      
      const cleared = await cartApi.clearCartItems(cart.id);
      if (!cleared) {
        toast.error('Erro ao limpar o carrinho');
        return;
      }

      await refreshCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Erro ao limpar o carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total items in cart
  const cartCount = cart?.summary.totalItems || 0;

  const value: CartContextType = {
    cart,
    cartCount,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}
