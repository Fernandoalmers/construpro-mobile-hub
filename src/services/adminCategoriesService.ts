
// Re-export the new categories service for backward compatibility
export * from './admin/categories';

// Export segments service as before
export * from './admin/productSegmentsService';

// Maintain backward compatibility with old function names
export { 
  fetchProductCategories as fetchAdminCategories,
  createProductCategory as createCategory,
  updateProductCategory as updateCategory,
  deleteProductCategory as deleteCategory
} from './admin/categories';

export { 
  getProductSegments as fetchAdminSegments,
  createProductSegment as createSegment,
  updateProductSegment as updateSegment,
  deleteProductSegment as deleteSegment,
  uploadSegmentImage,
  deleteSegmentImage
} from './admin/productSegmentsService';

// Get badge color for status
export const getCategoryStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
