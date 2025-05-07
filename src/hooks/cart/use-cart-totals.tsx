import { CartItem } from '@/types/cart';

type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  totalPoints: number;
};

export const useCartTotals = (
  cartItems: CartItem[], 
  storeCount: number, 
  appliedCouponDiscount: number = 0,
  cartSummaryPoints: number = 0
): Totals => {
  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  
  // Calculate discount from coupon
  const discount = appliedCouponDiscount > 0 ? (subtotal * appliedCouponDiscount / 100) : 0;
  
  // Calculate shipping - showing "A calcular" in UI, but keeps 0 for calculation
  const shipping = 0; // No shipping cost for now, will be calculated later
  
  // Calculate total
  const total = subtotal + shipping - discount;
  
  // Calculate points - use cart summary or estimate based on total
  const totalPoints = cartSummaryPoints || Math.floor(total) * 2;
  
  return {
    subtotal,
    discount,
    shipping,
    total,
    totalPoints
  };
};
