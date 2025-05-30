
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';
import { addToCart as addToCartService } from '@/services/cart/operations/addToCart';

export async function addToCart(productId: string, quantity: number): Promise<void> {
  try {
    console.log(`[addToCart] Adding ${quantity} of product ${productId} to cart`);
    
    await addToCartService(productId, quantity);
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, profile } = useAuth();
  
  // Get user type with proper type guard and default
  const userType = React.useMemo(() => {
    const profileType = profile?.tipo_perfil || 'consumidor';
    return (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(profileType)) 
      ? profileType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
      : 'consumidor';
  }, [profile?.tipo_perfil]);
  
  // Get cart data with user type
  const { cart, isLoading, refreshCart } = useCartData(isAuthenticated, user?.id || null, userType);
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items in cart - improved with better logging
  const cartCount = React.useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      console.log('[CartProvider] No cart items, count = 0');
      return 0;
    }
    
    const count = cart.items.reduce((sum, item) => {
      return sum + (item.quantidade || 0);
    }, 0);
    
    console.log('[CartProvider] Calculated cart count:', count, 'from', cart.items.length, 'items');
    return count;
  }, [cart?.items]);
  
  const cartItems = cart?.items || [];
  
  console.log('[CartProvider] Rendering with:', {
    cartCount,
    itemsLength: cartItems.length,
    isLoading,
    userType,
    hasCart: !!cart,
    cartId: cart?.id
  });

  // Create context value
  const value: CartContextType = {
    cart,
    cartCount,
    cartItems,
    isLoading: isLoading || operations.isLoading,
    addToCart: operations.addToCart,
    updateQuantity: operations.updateQuantity,
    removeItem: operations.removeItem,
    clearCart: operations.clearCart,
    refreshCart
  };

  return <CartContextProvider value={value}>{children}</CartContextProvider>;
}

// Re-export the useCartContext as useCart for backward compatibility
export function useCart() {
  try {
    const context = useCartContext();
    console.log('[useCart] Context values:', {
      cartCount: context.cartCount,
      itemsLength: context.cartItems.length,
      isLoading: context.isLoading
    });
    return context;
  } catch (error) {
    console.error('useCart must be used within a CartProvider');
    // Return a fallback with no-op functions to prevent crashes
    return {
      cart: null,
      cartCount: 0,
      cartItems: [],
      isLoading: false,
      addToCart: async () => {},
      updateQuantity: async () => {},
      removeItem: async () => {},
      clearCart: async () => {},
      refreshCart: async () => {}
    };
  }
}
