
// This file re-exports all vendor services for backward compatibility
import { getVendorProfile, saveVendorProfile, uploadVendorImage, VendorProfile } from './vendorProfileService';
import { 
  getVendorProducts, 
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage,
  updateProductImages,
  VendorProduct
} from './vendorProductsService';
import { 
  getVendorOrders,
  updateOrderStatus,
  VendorOrder,
  OrderItem 
} from './vendorOrdersService';
import { 
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints,
  VendorCustomer 
} from './vendorCustomersService';
import { 
  getPointAdjustments,
  createPointAdjustment,
  PointAdjustment
} from './vendorPointsService';

// Type exports
export type { VendorProfile };
export type { VendorProduct };
export type { VendorOrder, OrderItem };
export type { VendorCustomer };
export type { PointAdjustment };
  
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
