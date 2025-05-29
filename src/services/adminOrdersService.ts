import { toast } from '@/components/ui/sonner';

// Re-export everything from the new modular structure
export * from './admin/orders';

// Keep backward compatibility by re-exporting the main functions
export { 
  fetchAdminOrders,
  getOrderDetails,
  updateOrderStatus,
  updateTrackingCode,
  getOrderStatusBadgeColor
} from './admin/orders';

// Deprecated: This file now serves as a re-export for backward compatibility
// Use direct imports from './admin/orders' instead
console.warn('adminOrdersService.ts is deprecated. Import directly from ./admin/orders instead.');
