
// This file re-exports all customer-related services for the vendor
import { getVendorCustomer, getVendorCustomers, searchCustomers, findCustomerByEmail } from './customerFetcher';
import { getCustomerPoints } from './customerPointsService';
import { addVendorCustomer, seedTestCustomers, migrateCustomersFromPointAdjustments, migrateCustomersFromOrders } from './customerManager';
import { searchAllProfiles, ensureCustomerRelationship } from './customerSearchService';
import { VendorCustomer } from './types';

// Re-export types
export type { VendorCustomer };

// Re-export all functions
export {
  // Original customer functions
  getVendorCustomer,
  getVendorCustomers,
  searchCustomers,
  findCustomerByEmail,
  getCustomerPoints,
  addVendorCustomer,
  seedTestCustomers,
  migrateCustomersFromPointAdjustments,
  migrateCustomersFromOrders,
  
  // New enhanced search functions
  searchAllProfiles,
  ensureCustomerRelationship
};
