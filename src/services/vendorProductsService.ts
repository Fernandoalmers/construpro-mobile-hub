
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
  subscribeToAllProducts
} from './vendor/products';

// Import these from the operations file
import {
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus
} from './vendor/products/productOperations';

// Import types separately to use 'export type'
import type { VendorProduct, VendorProductInput } from './vendor/products/types';
import type { ProductImage } from './vendor/products/productImages';

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
  subscribeToAllProducts
};

// Re-export types with 'export type'
export type { VendorProduct, VendorProductInput, ProductImage };
