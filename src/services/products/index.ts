
// Re-export all product-related functionality
import { 
  getProductsByVendor,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getCategories,
  getVendors,
  BaseProduct,
  VendorProduct,
  AdminProduct
} from './productBase';

import {
  getPendingProducts,
  markProductAsPending,
  approveProduct,
  rejectProduct,
  updateProductStatus
} from './productApproval';

import {
  subscribeToVendorProducts,
  subscribeToAllProducts,
  subscribeToAdminProductUpdates,
  unsubscribeFromChannel,
  unsubscribeAll
} from './productRealtime';

import {
  uploadProductImage,
  updateProductImages,
  getProductImages,
  updateProductImage,
  deleteProductImage,
  deleteProductImageFromStorage,
  ProductImage
} from './productImages';

import {
  mirrorChangesForAdmin,
  syncWithMarketplace,
  batchSyncApprovedProducts,
  refreshProductData
} from './productSync';

import {
  validateRequiredFields,
  validatePriceFields,
  checkProductHasImages,
  verifyStockAvailability,
  validateProduct,
  ValidationError
} from './productValidation';

// Export types
export type { BaseProduct, VendorProduct, AdminProduct, ProductImage, ValidationError };

// Export all functions
export {
  // Product Base
  getProductsByVendor,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getCategories,
  getVendors,
  
  // Product Approval
  getPendingProducts,
  markProductAsPending,
  approveProduct,
  rejectProduct,
  updateProductStatus,
  
  // Product Realtime
  subscribeToVendorProducts,
  subscribeToAllProducts,
  subscribeToAdminProductUpdates,
  unsubscribeFromChannel,
  unsubscribeAll,
  
  // Product Images
  uploadProductImage,
  updateProductImages,
  getProductImages,
  updateProductImage,
  deleteProductImage,
  deleteProductImageFromStorage,
  
  // Product Sync
  mirrorChangesForAdmin,
  syncWithMarketplace,
  batchSyncApprovedProducts,
  refreshProductData,
  
  // Product Validation
  validateRequiredFields,
  validatePriceFields,
  checkProductHasImages,
  verifyStockAvailability,
  validateProduct
};
