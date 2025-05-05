
// Export cart operations
export * from "./cartOperations";
export * from "./favoritesService";

// Combine services into a single export for backward compatibility
import * as cartOps from "./cartOperations";
import * as favoritesOps from "./favoritesService";

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
  getFavorites: favoritesOps.getFavorites
};
