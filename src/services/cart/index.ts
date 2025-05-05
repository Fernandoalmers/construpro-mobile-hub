
// Export core cart operations
export * from "./cartFetcher";
export { createCart } from "./cartManagement";
// Rename clearCart from cartManagement to avoid conflict
export { clearCart as clearCartFromManagement } from "./cartManagement";
export * from "./cartConsolidation";
export * from "./cartItemOperations";
export * from "./productInfo";

// Re-export existing related services
export * from "./favoritesService";
export * from "./cartItemsManager";

// Create legacy exports for backward compatibility
import * as cartFetcher from "./cartFetcher";
import * as cartManagement from "./cartManagement";
import * as cartConsolidation from "./cartConsolidation";
import * as cartItemOps from "./cartItemOperations";
import * as productInfo from "./productInfo";
import * as favoritesOps from "./favoritesService";
import * as cartItems from "./cartItemsManager";

export const cartService = {
  // Cart fetching operations
  getCart: cartFetcher.getCart,
  fetchCart: cartFetcher.fetchCart,
  
  // Cart management operations
  createCart: cartManagement.createCart,
  clearCart: cartItemOps.clearCart, // Use clearCart from cartItemOperations
  
  // Cart consolidation
  consolidateUserCarts: cartConsolidation.consolidateUserCarts,
  
  // Cart item operations
  addToCart: cartItemOps.addToCart,
  updateCartItemQuantity: cartItemOps.updateCartItemQuantity,
  removeFromCart: cartItemOps.removeFromCart,
  
  // Favorites operations
  addToFavorites: favoritesOps.addToFavorites,
  isProductFavorited: favoritesOps.isProductFavorited,
  getFavorites: favoritesOps.getFavorites,
  
  // Cart item management
  findCartItem: cartItems.findCartItem,
  addItemToCart: cartItems.addItemToCart,
  updateItemQuantity: cartItems.updateItemQuantity,
  removeCartItem: cartItems.removeCartItem,
  clearCartItems: cartItems.clearCartItems,
  
  // Product info
  fetchProductInfo: productInfo.fetchProductInfo
};
