
// Re-export all admin product functions with explicit naming to avoid collisions

// From API layer
export { 
  getAdminProducts as getAdminProductsApi,
  getPendingProducts as getPendingProductsApi,
  debugFetchProducts,
  fetchPendingProducts,
  fetchAdminProducts
} from './api';

// From adminProductActions - but mark as deprecated
export {
  approveProduct as approveProductAction,
  rejectProduct as rejectProductAction
} from './adminProductActions';

// From adminProductRealtime
export * from './adminProductRealtime';

// From productApproval - these are the ones to use
export * from './productApproval';
