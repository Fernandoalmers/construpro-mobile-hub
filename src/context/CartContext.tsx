
import React, { createContext, useContext } from 'react';
import { Cart, CartContextType } from '@/types/cart';

// Create the cart context with default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook to use the cart context
export function useCartContext() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  
  return context;
}

// Export the CartContext Provider component
export const CartContextProvider = CartContext.Provider;
