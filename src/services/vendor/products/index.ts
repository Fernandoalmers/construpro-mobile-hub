
// Re-export types
export type { VendorProduct, VendorProductInput } from './types';
export type { ProductImage } from './productImages';

// Re-export product operations
export {
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus
} from './productOperations';

// Re-export realtime functionality
export {
  subscribeToVendorProducts,
  subscribeToAllProducts
} from './productRealtime';

// Re-export image functionality
export {
  uploadProductImage,
  updateProductImages,
  getProductImages,
  updateProductImage,
  deleteProductImage
} from './productImages';
