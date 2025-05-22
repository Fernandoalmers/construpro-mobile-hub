
// This file re-exports all vendor customer services for backward compatibility
import {
  VendorCustomer,
  getVendorCustomer,
  getVendorCustomers,
  searchCustomers,
  findCustomerByEmail,
  getCustomerPoints,
  addVendorCustomer,
  seedTestCustomers,
  migrateCustomersFromPointAdjustments,
  migrateCustomersFromOrders
} from './vendor/customers';

// Re-export types
export type { VendorCustomer };

// Re-export all functions
export {
  getVendorCustomer,
  getVendorCustomers,
  searchCustomers,
  findCustomerByEmail,
  getCustomerPoints,
  addVendorCustomer,
  seedTestCustomers,
  migrateCustomersFromPointAdjustments,
  migrateCustomersFromOrders
};
