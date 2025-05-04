
// Re-export all admin product functions with explicit naming to avoid collisions

// From API layer
export { 
  getAdminProducts as getAdminProductsApi,
  getPendingProducts as getPendingProductsApi,
  debugFetchProducts,
  fetchPendingProducts,
  fetchAdminProducts
} from './api';

// From adminProductActions
export {
  approveProduct as approveProductAction,
  rejectProduct as rejectProductAction
} from './adminProductActions';

// From adminProductRealtime
export * from './adminProductRealtime';

// From productApproval
export * from './productApproval';
