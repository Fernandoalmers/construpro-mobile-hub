
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
      refreshCart();
    } else {
      setCart(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Get current cart
  const refreshCart = async (): Promise<void> => {
    if (!user) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const cartData = await cartApi.fetchCart(user.id);
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
      toast.error('Faça login para adicionar produtos ao carrinho');
      return;
    }

    try {
      setIsLoading(true);

      // Get the product price
      const product = await cartApi.fetchProductInfo(productId);
      if (!product) {
        toast.error('Produto não encontrado');
        return;
      }

      if (product.estoque < quantity) {
        toast.error('Quantidade solicitada não disponível em estoque');
        return;
      }

      // Get or create a cart
      let cartId;
      if (cart) {
        cartId = cart.id;
        
        // Check if product already exists in cart
        const existingItem = await cartApi.findCartItem(cartId, productId);

        if (existingItem) {
          // Update existing item
          const newQuantity = existingItem.quantity + quantity;
          
          if (product.estoque < newQuantity) {
            toast.error('Quantidade solicitada excede o estoque disponível');
            return;
          }
          
          const updated = await cartApi.updateItemQuantity(existingItem.id, newQuantity);
          if (!updated) {
            toast.error('Erro ao atualizar o carrinho');
            return;
          }
          
          await refreshCart();
          return;
        }
      } else {
        // Create new cart
        cartId = await cartApi.createCart(user.id);
        if (!cartId) {
          toast.error('Erro ao criar o carrinho');
          return;
        }
      }

      // Add new item to cart
      const added = await cartApi.addItemToCart(cartId, productId, quantity, product.preco);
      if (!added) {
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
