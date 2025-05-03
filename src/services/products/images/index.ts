
// Re-export all product image functionality
export type { ProductImage } from './productImageTypes';
export { uploadProductImage } from './imageUpload';
export { 
  updateProductImages,
  getProductImages,
  updateProductImage 
} from './imageManagement';
export { 
  deleteProductImage,
  deleteProductImageFromStorage 
} from './imageDeletion';
