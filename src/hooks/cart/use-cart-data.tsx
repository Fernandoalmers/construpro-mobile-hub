
import { useCartState } from './data/useCartState';

/**
 * Main hook to manage cart data
 */
export function useCartData(
  isAuthenticated: boolean, 
  userId: string | null,
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
) {
  // Use the cart state management hook with user type
  return useCartState(isAuthenticated, userId, userType);
}
