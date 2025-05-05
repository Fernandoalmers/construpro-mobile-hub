
// This file re-exports all functionality from the cart module for backward compatibility
export * from "./cart";

// Re-export the CartItem and Cart types for backward compatibility
import { Cart, CartItem } from "@/types/cart";
export type { Cart, CartItem };

// Re-export the cartService
export { cartService } from "./cart";


