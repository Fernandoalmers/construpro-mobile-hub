
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
  const [forceEmptyCount, setForceEmptyCount] = useState(false);
  
  // Get user type with proper type guard
  const userType = profile?.tipo_perfil || 'consumidor';
  const validUserType = (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(userType)) 
    ? userType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
    : 'consumidor';
  
  // Get cart data with user type
  const { cart, isLoading, refreshCart } = useCartData(isAuthenticated, user?.id || null, validUserType);
  
  // Enhanced refresh function that handles empty cart state
  const enhancedRefreshCart = async () => {
    await refreshCart();
    
    // Check if cart is empty after refresh and force count to 0
    if (cart && cart.items && cart.items.length === 0) {
      console.log('[CartProvider] Cart is empty after refresh, forcing count to 0');
      setForceEmptyCount(true);
      // Reset the flag after a brief moment
      setTimeout(() => setForceEmptyCount(false), 100);
    }
  };
  
  // Get cart operations with enhanced refresh
  const operations = useCartOperations(enhancedRefreshCart);

  // Calculate total items in cart - with forced empty state handling
  const cartItems = cart?.items || [];
  let cartCount = 0;
  
  if (forceEmptyCount || cartItems.length === 0) {
    cartCount = 0;
  } else {
    cartCount = cartItems.reduce((sum, item) => sum + (item.quantidade || 0), 0);
  }
  
  console.log('CartProvider: cartCount =', cartCount, 'cartItems.length =', cartItems.length, 'isLoading =', isLoading, 'userType =', validUserType, 'forceEmptyCount =', forceEmptyCount);

  // Force refresh cart when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('Authentication state changed, refreshing cart');
      refreshCart();
    }
  }, [isAuthenticated, user?.id, refreshCart]);
  
  // Reset force empty flag when cart items change
  useEffect(() => {
    if (cartItems.length > 0 && forceEmptyCount) {
      setForceEmptyCount(false);
    }
  }, [cartItems.length, forceEmptyCount]);
  
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
    refreshCart: enhancedRefreshCart
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
