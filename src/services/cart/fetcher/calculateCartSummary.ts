
import { CartItem } from '@/types/cart';
import { getProductPoints } from '@/utils/pointsCalculations';

/**
 * Calculate cart summary based on the cart items
 */
export const calculateCartSummary = (
  items: CartItem[], 
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
) => {
  let subtotal = 0;
  let totalItems = 0;
  let totalPoints = 0;

  // Calculate totals based on the items
  items.forEach(item => {
    subtotal += item.subtotal || 0;
    totalItems += item.quantidade || 0;
    
    // Use getProductPoints to calculate correct points based on user type
    const pointsPerUnit = getProductPoints(item.produto, userType);
    totalPoints += pointsPerUnit * item.quantidade;
  });

  return {
    subtotal,
    totalItems,
    totalPoints
  };
};
