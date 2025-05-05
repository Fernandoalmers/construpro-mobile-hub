
// This file re-exports all functionality from the cart module
export * from './cartService';
export * from './productFetcher';

// Re-export the CartItem and Cart types
import { Cart, CartItem } from "@/types/cart";
export type { Cart, CartItem };

// Re-export the cartService
export { cartService } from './cartService';
export { productFetcher } from './productFetcher';
