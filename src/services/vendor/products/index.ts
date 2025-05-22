
export { 
  getVendorProducts,
  getVendorProduct,
  fetchProductDetails
} from './productFetcher';

export { 
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus
} from './productOperations';

export { 
  uploadProductImage,
  updateProductImages,
  getProductImages,
  updateProductImage,
  deleteProductImage
} from './productImages';

export { 
  subscribeToVendorProducts,
  subscribeToAllProducts
} from './productRealtime';

export type { VendorProduct, VendorProductInput, ProductImage } from './types';
