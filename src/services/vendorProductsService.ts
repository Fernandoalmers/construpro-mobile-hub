
// This file re-exports from the vendor/products module for backward compatibility
import {
  getVendorProducts,
  getVendorProduct,
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

// Import the vendor-specific uploadProductImage (3 params)
import { uploadProductImage } from './vendor/products/productImages';

// Import types separately
import type { VendorProduct, VendorProductInput, ProductImage } from './vendor/products/types';

// Re-export functions - using the vendor-specific uploadProductImage
export {
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,     // This is now the 3-param version from vendor/products
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
