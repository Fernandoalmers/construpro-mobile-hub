
// This file re-exports from the vendor/products module for backward compatibility
import {
  VendorProduct,
  VendorProductInput,
  ProductImage,
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
} from './vendor/products';

// Re-export everything
export {
  VendorProduct,
  VendorProductInput,
  ProductImage,
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
