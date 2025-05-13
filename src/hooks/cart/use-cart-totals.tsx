
import { useState, useMemo } from 'react';
import { CartItem } from '@/types/cart';

export const useCartTotals = (
  cartItems: CartItem[],
  storeCount: number,
  discountAmount: number = 0,
  totalCartPoints: number = 0
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
  
  // Use provided totalPoints or calculate
  const totalPoints = totalCartPoints || cartItems.reduce((sum, item) => {
    const itemPoints = (item.produto?.pontos || 0) * item.quantidade;
    return sum + itemPoints;
  }, 0);
  
  return {
    subtotal,
    shipping,
    discount,
    total,
    totalPoints
  };
};
