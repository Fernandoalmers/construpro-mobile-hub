
// Re-export admin product services for backward compatibility
import { logAdminAction } from './adminService';
import { toast } from '@/components/ui/sonner';

// Import from our new modular product services
import {
  // Types
  AdminProduct,
  
  // Functions
  getAllProducts as fetchAdminProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getCategories,
  getVendors,
  subscribeToAdminProductUpdates
} from './products';

// Re-export types and functions
export type { AdminProduct };
export { 
  fetchAdminProducts,
  approveProduct, 
  rejectProduct, 
  deleteProduct, 
  getCategories,
  getVendors,
  subscribeToAdminProductUpdates
};
