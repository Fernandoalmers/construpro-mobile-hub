
// Re-export from the new location for backward compatibility
export {
  getAdminStores as fetchAdminStores,
  getAdminPendingStores as fetchPendingStores,
  approveStore,
  rejectStore,
  deleteStore,
  getStoreBadgeColor,
  subscribeToAdminStoreUpdates
} from './admin/stores';

// Re-export AdminStore type
export { type AdminStore } from '@/types/admin';
