
// Export cart operations
export * from "./cartOperations";
export * from "./favoritesService";
export * from "./cartItemsManager";
export * from "./cartFetcher";
export * from "./productFetcher";

// Combine services into a single export for backward compatibility
import * as cartOps from "./cartOperations";
import * as favoritesOps from "./favoritesService";
import * as cartItems from "./cartItemsManager";
import * as cartFetcher from "./cartFetcher";
import * as productFetcher from "./productFetcher";

export const cartService = {
  // Cart operations
  getCart: cartOps.getCart,
  addToCart: cartOps.addToCart,
  updateCartItemQuantity: cartOps.updateCartItemQuantity,
  removeFromCart: cartOps.removeFromCart,
  clearCart: cartOps.clearCart,
  
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
  fetchCart: cartFetcher.fetchCart,
  createCart: cartFetcher.createCart,
  
  // Product info
  fetchProductInfo: productFetcher.fetchProductInfo
};
