
// This file re-exports all vendor services for backward compatibility
import { getVendorProfile, saveVendorProfile, uploadVendorImage, VendorProfile } from './vendorProfileService';
import { 
  getVendorOrders,
  updateOrderStatus,
  VendorOrder,
  OrderItem 
} from './vendor/orders';
import { 
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints,
  addVendorCustomer,
  seedTestCustomers,
  migrateCustomersFromPointAdjustments,
  migrateCustomersFromOrders,
  VendorCustomer 
} from './vendorCustomersService';
import { 
  getPointAdjustments,
  createPointAdjustment,
  PointAdjustment
} from './vendor/points';

// Import and re-export from our new modular product services
import {
  // Product functions
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,
  updateProductImages,
  subscribeToVendorProducts
} from './vendor/products';

// Import types
import type { VendorProduct, ProductImage } from './vendor/products/types';

// Type exports
export type { VendorProfile };
export type { VendorProduct };
export type { VendorOrder, OrderItem };
export type { VendorCustomer };
export type { PointAdjustment };
export type { ProductImage };
  
// Function exports
export {
  // Vendor Profile
  getVendorProfile,
  saveVendorProfile,
  uploadVendorImage,

  // Products
  getVendorProducts,
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,
  updateProductImages,
  subscribeToVendorProducts,
  
  // Orders
  getVendorOrders,
  updateOrderStatus,
  
  // Customers
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints,
  addVendorCustomer,
  seedTestCustomers,
  migrateCustomersFromPointAdjustments,
  migrateCustomersFromOrders,
  
  // Points
  getPointAdjustments,
  createPointAdjustment
};
