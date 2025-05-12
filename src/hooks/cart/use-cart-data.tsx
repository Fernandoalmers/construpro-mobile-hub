
import { useCartState } from './data/useCartState';

/**
 * Main hook to manage cart data
 */
export function useCartData(isAuthenticated: boolean, userId: string | null) {
  // Use the cart state management hook
  return useCartState(isAuthenticated, userId);
}
