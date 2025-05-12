
import { CartItem } from '@/types/cart';

/**
 * Calculate cart summary based on the cart items
 */
export const calculateCartSummary = (items: CartItem[]) => {
  let subtotal = 0;
  let totalItems = 0;
  let totalPoints = 0;

  // Calculate totals based on the items
  items.forEach(item => {
    subtotal += item.subtotal || 0;
    totalItems += item.quantidade || 0;
    totalPoints += (item.produto?.pontos || 0) * item.quantidade;
  });

  // Calculate shipping (fixed shipping fee of 15.90 if cart has items, otherwise 0)
  const shipping = subtotal > 0 ? 15.90 : 0;

  return {
    subtotal,
    shipping,
    totalItems,
    totalPoints
  };
};
