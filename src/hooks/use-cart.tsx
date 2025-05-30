import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

// Debounce function for better performance
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      func(...args);
    }, delay);
    
    setTimeoutId(newTimeoutId);
  }, [func, delay, timeoutId]);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, profile } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [lastClearTime, setLastClearTime] = useState<number>(0);
  
  // Get user type with proper type guard
  const userType = profile?.tipo_perfil || 'consumidor';
  const validUserType = (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(userType)) 
    ? userType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
    : 'consumidor';
  
  // Get cart data with user type
  const { cart, isLoading, refreshCart: originalRefreshCart } = useCartData(isAuthenticated, user?.id || null, validUserType);
  
  // Debounced refresh to avoid excessive calls
  const debouncedRefreshCart = useDebounce(originalRefreshCart, 300);
  
  // Enhanced refresh function that updates cartCount properly
  const enhancedRefreshCart = useCallback(async () => {
    await originalRefreshCart();
  }, [originalRefreshCart]);
  
  // Immediate cart clear handler
  const handleCartCleared = useCallback(() => {
    console.log('[CartProvider] Cart cleared, setting cartCount to 0 immediately');
    setCartCount(0);
    setLastClearTime(Date.now());
  }, []);
  
  // Get cart operations with enhanced refresh and clear handler
  const operations = useCartOperations(enhancedRefreshCart, handleCartCleared);

  // Calculate cartCount with memoization for performance
  const cartItems = cart?.items || [];
  
  // Use memoized calculation to avoid unnecessary recalculations
  const calculatedCartCount = useMemo(() => {
    // If cart was just cleared, keep count at 0 for a short period
    const timeSinceClear = Date.now() - lastClearTime;
    if (timeSinceClear < 1000 && cartItems.length === 0) {
      return 0;
    }
    
    if (cartItems.length === 0) {
      return 0;
    }
    
    return cartItems.reduce((sum, item) => sum + (item.quantidade || 0), 0);
  }, [cartItems, lastClearTime]);
  
  // Update cartCount when calculated count changes
  useEffect(() => {
    if (calculatedCartCount !== cartCount) {
      console.log('[CartProvider] Updating cartCount from', cartCount, 'to', calculatedCartCount);
      setCartCount(calculatedCartCount);
    }
  }, [calculatedCartCount, cartCount]);
  
  console.log('CartProvider: cartCount =', cartCount, 'cartItems.length =', cartItems.length, 'isLoading =', isLoading, 'userType =', validUserType);

  // Optimized authentication effect - only refresh when necessary
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('Authentication state changed, refreshing cart');
      debouncedRefreshCart();
    } else {
      // Clear cart count when not authenticated
      setCartCount(0);
    }
  }, [isAuthenticated, user?.id, debouncedRefreshCart]);
  
  // Cleanup abandoned carts with better frequency control
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
      
      // Run once on mount, then weekly
      const timeoutId = setTimeout(runCleanup, 5000); // Delay initial cleanup
      const cleanupInterval = setInterval(runCleanup, 7 * 24 * 60 * 60 * 1000);
      
      return () => {
        clearTimeout(timeoutId);
        clearInterval(cleanupInterval);
      };
    }
  }, [isAuthenticated, user?.id]);

  // Create context value with memoization for performance
  const value: CartContextType = useMemo(() => ({
    cart,
    cartCount,
    cartItems,
    isLoading: isLoading || operations.isLoading,
    addToCart: operations.addToCart,
    updateQuantity: operations.updateQuantity,
    removeItem: operations.removeItem,
    clearCart: operations.clearCart,
    refreshCart: enhancedRefreshCart
  }), [
    cart,
    cartCount,
    cartItems,
    isLoading,
    operations.isLoading,
    operations.addToCart,
    operations.updateQuantity,
    operations.removeItem,
    operations.clearCart,
    enhancedRefreshCart
  ]);

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
