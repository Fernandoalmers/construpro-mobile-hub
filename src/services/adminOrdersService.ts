
import { toast } from '@/components/ui/sonner';

// Re-export everything from the new modular structure
export * from './admin/orders';

// Keep backward compatibility by re-exporting the main functions
export { 
  fetchAdminOrders,
  fetchAdminOrdersLegacy as fetchAdminOrdersCompat,
  getOrderDetails,
  updateOrderStatus,
  updateTrackingCode,
  getOrderStatusBadgeColor
} from './admin/orders';

// Backward compatibility wrapper for components that don't use pagination yet
export const fetchAdminOrdersSimple = async () => {
  const { fetchAdminOrdersLegacy } = await import('./admin/orders');
  return fetchAdminOrdersLegacy();
};

// Deprecated: This file now serves as a re-export for backward compatibility
// Use direct imports from './admin/orders' instead
console.warn('adminOrdersService.ts is deprecated. Import directly from ./admin/orders instead.');
