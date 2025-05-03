
// This file re-exports all vendor services for backward compatibility
import { getVendorProfile, saveVendorProfile, uploadVendorImage, VendorProfile } from './vendorProfileService';
import { 
  getVendorProducts, 
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,
  updateProductImages
} from './vendorProductsService';
import { 
  getVendorOrders,
  updateOrderStatus 
} from './vendorOrdersService';
import { 
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints 
} from './vendorCustomersService';
import { 
  getPointAdjustments,
  createPointAdjustment 
} from './vendorPointsService';

// Type exports
export type { VendorProfile };
export type { VendorProduct } from './vendorProductsService';
export type { VendorOrder, OrderItem } from './vendorOrdersService';
export type { VendorCustomer } from './vendorCustomersService';
export type { PointAdjustment } from './vendorPointsService';
  
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
  
  // Orders
  getVendorOrders,
  updateOrderStatus,
  
  // Customers
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints,
  
  // Points
  getPointAdjustments,
  createPointAdjustment
};
