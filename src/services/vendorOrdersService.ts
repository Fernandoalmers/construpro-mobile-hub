
import { getVendorOrders, updateOrderStatus, VendorOrder, OrderItem, OrderFilters } from './vendor/orders';
import { fetchDirectVendorOrdersWithDebug } from './vendor/orders/utils/ordersFetcher';
import { runOrdersMigration } from './vendor/utils/orderMigration';

// Add a direct export of the debug-enabled function for transparency in diagnostics
export { getVendorOrders, updateOrderStatus, fetchDirectVendorOrdersWithDebug, runOrdersMigration };
export type { VendorOrder, OrderItem, OrderFilters };
