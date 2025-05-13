
import { CartItem } from '@/types/cart';

/**
 * Calculate cart summary based on the cart items
 */
export const calculateCartSummary = (items: CartItem[]) => {
  let subtotal = 0;
  let totalItems = 0;
  let totalPoints = 0;

  // Track unique store IDs to calculate shipping
  const storeIds = new Set<string>();

  // Calculate totals based on the items
  items.forEach(item => {
    subtotal += item.subtotal || 0;
    totalItems += item.quantidade || 0;
    totalPoints += (item.produto?.pontos || 0) * item.quantidade;
    
    // Add store ID to set if it exists
    if (item.produto?.loja_id) {
      storeIds.add(item.produto.loja_id);
    }
  });

  // Set shipping to FREE regardless of store count
  const shipping = 0;

  return {
    subtotal,
    shipping,
    totalItems,
    totalPoints
  };
};
