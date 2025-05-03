
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
  uploadProductImage,
  updateProductImages,
  getProductImages,
  updateProductImage,
  deleteProductImage,
  deleteProductImageFromStorage,
  ProductImage
} from './images';

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

// Re-export from the new modular admin product services
import {
  getPendingProducts,
  markProductAsPending,
  approveProduct,
  rejectProduct,
  updateProductStatus
} from '@/services/admin/products/productApproval';

import {
  subscribeToVendorProducts,
  subscribeToAllProducts,
  subscribeToAdminProductUpdates,
  unsubscribeFromChannel,
  unsubscribeAll
} from './productRealtime';

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
  
  // Product Approval (now from admin/products module)
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
