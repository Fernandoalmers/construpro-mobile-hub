
// This file re-exports all vendor services for backward compatibility
import { Vendor, getVendorProfile, saveVendorProfile, uploadVendorImage } from './vendorProfileService';
import { 
  VendorProduct, 
  getVendorProducts, 
  getVendorProduct,
  saveVendorProduct,
  deleteVendorProduct,
  updateProductStatus,
  uploadProductImage 
} from './vendorProductsService';
import { 
  VendorOrder, 
  OrderItem,
  getVendorOrders,
  updateOrderStatus 
} from './vendorOrdersService';
import { 
  VendorCustomer, 
  getVendorCustomers,
  getVendorCustomer,
  searchCustomers,
  getCustomerPoints 
} from './vendorCustomersService';
import { 
  PointAdjustment, 
  getPointAdjustments,
  createPointAdjustment 
} from './vendorPointsService';

export {
  // Types
  Vendor,
  VendorProduct,
  VendorOrder,
  OrderItem,
  VendorCustomer,
  PointAdjustment,
  
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
