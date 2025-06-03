
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

// Import types separately
import type { VendorProduct, VendorProductInput, ProductImage } from './vendor/products/types';

// Re-export functions - NOTE: uploadProductImage is NOT re-exported to avoid conflicts
// Components should import it directly from vendor/products/productImages
export {
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
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
