
import { useState } from 'react';
import { useCartAdd } from './use-cart-add';
import { useCartUpdate } from './use-cart-update';
import { useCartRemove } from './use-cart-remove';
import { useCartClear } from './use-cart-clear';

/**
 * Hook that combines all cart operations into a single interface
 */
export function useCartOperations(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize individual operation hooks
  const { addToCart } = useCartAdd(refreshCartData);
  const { updateQuantity } = useCartUpdate(refreshCartData);
  const { removeItem } = useCartRemove(refreshCartData);
  const { clearCart } = useCartClear(refreshCartData);
  
  // Combine loading states
  const updateLoadingState = (loading: boolean) => {
    setIsLoading(loading);
  };

  return {
    isLoading,
    setIsLoading: updateLoadingState,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart
  };
}
