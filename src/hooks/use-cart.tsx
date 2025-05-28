
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';
import { addToCart as addToCartService } from '@/services/cart/operations/addToCart';
import { cleanupAbandonedCarts } from '@/services/cart/cartCleanup';

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
  
  // Get user type with proper type guard
  const userType = profile?.tipo_perfil || 'consumidor';
  const validUserType = (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(userType)) 
    ? userType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
    : 'consumidor';
  
  // Get cart data with user type
  const { cart, isLoading, refreshCart } = useCartData(isAuthenticated, user?.id || null, validUserType);
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items in cart - ensure it's using the latest cart data
  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
  const cartItems = cart?.items || [];
  
  console.log('CartProvider: cartCount =', cartCount, 'isLoading =', isLoading, 'userType =', validUserType);

  // Force refresh cart when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('Authentication state changed, refreshing cart');
      refreshCart();
    }
  }, [isAuthenticated, user?.id, refreshCart]);
  
  // Cleanup abandoned carts periodically
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Run cart cleanup once when component mounts
      const runCleanup = async () => {
        try {
          console.log('Running cart cleanup');
          await cleanupAbandonedCarts();
        } catch (error) {
          console.error('Error during cart cleanup:', error);
        }
      };
      
      // Run once on mount
      runCleanup();
      
      // Then run weekly
      const cleanupInterval = setInterval(runCleanup, 7 * 24 * 60 * 60 * 1000);
      
      return () => clearInterval(cleanupInterval);
    }
  }, [isAuthenticated, user?.id]);

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
    return useCartContext();
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
