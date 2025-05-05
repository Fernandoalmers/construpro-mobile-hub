
// Export core cart operations
export * from "./cartFetcher";
export { createCart } from "./cartManagement";
// Rename clearCart from cartManagement to avoid conflict
export { clearCart as clearCartFromManagement } from "./cartManagement";
export * from "./cartConsolidation";
export * from "./cartItemOperations";
export * from "./stockChecker";
// Use aliases for cartItemModifier exports to avoid conflicts with cartItemsManager
export { 
  addNewCartItem,
  updateExistingCartItem,
  findExistingCartItem,
  removeCartItem as removeItemFromCart,
  clearCartItems as clearItemsFromCart 
} from "./cartItemModifier";
export * from "./productInfo";

// Re-export existing related services
export * from "./favoritesService";
// Use aliases for cartItemsManager exports to avoid conflicts with cartItemModifier
export { 
  findCartItem,
  addItemToCart,
  updateItemQuantity,
  removeCartItem as removeCartItemFromManager,
  clearCartItems as clearCartItemsFromManager
} from "./cartItemsManager";

// Create legacy exports for backward compatibility
import * as cartFetcher from "./cartFetcher";
import * as cartManagement from "./cartManagement";
import * as cartConsolidation from "./cartConsolidation";
import * as cartItemOps from "./cartItemOperations";
import * as stockChecker from "./stockChecker";
import * as cartItemModifier from "./cartItemModifier";
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
  ensureSingleActiveCart: cartConsolidation.ensureSingleActiveCart,
  
  // Cart item operations
  addToCart: cartItemOps.addToCart,
  updateCartItemQuantity: cartItemOps.updateCartItemQuantity,
  removeFromCart: cartItemOps.removeFromCart,
  fixCartStockIssues: cartItemOps.fixCartStockIssues,
  
  // Stock operations
  checkProductStock: stockChecker.checkProductStock,
  checkTotalStockAvailability: stockChecker.checkTotalStockAvailability,
  validateCartItemsStock: stockChecker.validateCartItemsStock,
  
  // Cart item modifier operations
  addNewCartItem: cartItemModifier.addNewCartItem,
  updateExistingCartItem: cartItemModifier.updateExistingCartItem,
  findExistingCartItem: cartItemModifier.findExistingCartItem,
  removeItemFromCart: cartItemModifier.removeCartItem, // Renamed to avoid duplicate
  clearItemsFromCart: cartItemModifier.clearCartItems, // Renamed to avoid duplicate
  
  // Favorites operations
  addToFavorites: favoritesOps.addToFavorites,
  isProductFavorited: favoritesOps.isProductFavorited,
  getFavorites: favoritesOps.getFavorites,
  
  // Cart item management
  findCartItem: cartItems.findCartItem,
  addItemToCart: cartItems.addItemToCart,
  updateItemQuantity: cartItems.updateItemQuantity,
  removeCartItemFromManager: cartItems.removeCartItem, // Renamed to avoid duplicate
  clearCartItemsFromManager: cartItems.clearCartItems, // Renamed to avoid duplicate
  
  // Product info
  fetchProductInfo: productInfo.fetchProductInfo
};
