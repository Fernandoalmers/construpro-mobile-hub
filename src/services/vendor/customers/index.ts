
// This file re-exports all customer-related services for the vendor
import { getVendorCustomer, getVendorCustomers, searchCustomers, findCustomerByEmail } from './customerFetcher';
import { getCustomerPoints } from './customerPointsService';
import { addVendorCustomer } from './customerCreator';
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
  
  // New enhanced search functions
  searchAllProfiles,
  ensureCustomerRelationship
};
