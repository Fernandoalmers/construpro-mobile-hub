
// Re-export from the correct location to maintain compatibility
export { getVendorOrders, updateOrderStatus, fetchDirectVendorOrdersWithDebug } from './vendor/orders';
export type { VendorOrder, OrderItem, OrderFilters } from './vendor/orders';

// Mark as deprecated
console.warn('adminOrdersService.ts is deprecated. Import directly from ./vendor/orders instead.');
