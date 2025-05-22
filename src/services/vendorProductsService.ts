
// This file re-exports from the vendor/products module for backward compatibility
import {
  getVendorProducts,
  getVendorProduct,
  uploadProductImage,
  updateProductImages,
  getProductImages,
  updateProductImage,
  deleteProductImage,
  subscribeToVendorProducts,
  subscribeToAllProducts,
  fetchProductDetails,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus
} from './vendor/products';

// Import types separately
import type { VendorProduct, VendorProductInput, ProductImage } from './vendor/products/types';

// Re-export functions
export {
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,
  updateProductImages,
  getProductImages,
  updateProductImage,
  deleteProductImage,
  subscribeToVendorProducts,
  subscribeToAllProducts,
  fetchProductDetails
};

// Re-export types
export type { VendorProduct, VendorProductInput, ProductImage };
