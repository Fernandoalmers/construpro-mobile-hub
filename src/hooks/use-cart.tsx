
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';

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
  const { cart, isLoading, refreshCart, refreshKey } = useCartData(isAuthenticated, user?.id || null, userType);
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items in cart
  const cartCount = React.useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
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
    hasCart: !!cart
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

// Re-export the useCartContext as useCart
export function useCart() {
  try {
    const context = useCartContext();
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
