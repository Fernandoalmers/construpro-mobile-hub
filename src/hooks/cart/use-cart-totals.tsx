
import { useState, useMemo } from 'react';
import { CartItem } from '@/types/cart';
import { getProductPoints } from '@/utils/pointsCalculations';

export const useCartTotals = (
  cartItems: CartItem[],
  storeCount: number,
  discountAmount: number = 0,
  totalCartPoints: number = 0,
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
) => {
  // Calculate subtotal from cart items
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const itemSubtotal = item.preco * item.quantidade;
      return sum + itemSubtotal;
    }, 0);
  }, [cartItems]);
  
  // Set shipping to FREE regardless of store count
  const shipping = 0;
  
  // Calculate discount (if any)
  const discount = Math.min(discountAmount, subtotal); // Can't discount more than subtotal
  
  // Calculate total
  const total = subtotal + shipping - discount;
  
  // Calculate points using getProductPoints for correct user type calculation
  const totalPoints = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const itemPoints = getProductPoints(item.produto, userType) * item.quantidade;
      return sum + itemPoints;
    }, 0);
  }, [cartItems, userType]);
  
  return {
    subtotal,
    shipping,
    discount,
    total,
    totalPoints
  };
};
