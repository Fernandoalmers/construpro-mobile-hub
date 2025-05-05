
// Export core cart operations
export * from "./cartCore";
export * from "./cartItemOperations";
export * from "./productInfo";

// Re-export existing related services
export * from "./favoritesService";
export * from "./cartItemsManager";

// Export cartFetcher separately to avoid naming conflicts
import * as cartFetcherModule from "./cartFetcher";
export { fetchCart } from "./cartFetcher";

// Create legacy exports for backward compatibility
import * as cartCore from "./cartCore";
import * as cartItemOps from "./cartItemOperations";
import * as productInfo from "./productInfo";
import * as favoritesOps from "./favoritesService";
import * as cartItems from "./cartItemsManager";
import * as cartFetcher from "./cartFetcher";

export const cartService = {
  // Cart core operations
  getCart: cartCore.getCart,
  createCart: cartCore.createCart,
  clearCart: cartCore.clearCart,
  
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
  
  // Cart fetching and creation
  fetchCart: cartCore.getCart,
  
  // Product info
  fetchProductInfo: productInfo.fetchProductInfo
};
