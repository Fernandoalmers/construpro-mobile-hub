
import React from 'react';
import { Route } from 'react-router-dom';
import { 
  ProtectedRoute,
  AdminDashboard,
  UsersManagement,
  ProductsManagementScreen,
  StoresManagementScreen,
  RedemptionsManagementScreen,
  OrdersManagementScreen,
  AdminLogsScreen,
  AdminSettingsScreen,
  AdminRewardsScreen,
  AdminCategoriesScreen
} from '../imports';
import AdminCouponsScreen from '../components/admin/coupons/AdminCouponsScreen';

const AdminRoutes: React.FC = () => {
  return (
    <>
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requireAdmin={true}><UsersManagement /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductsManagementScreen /></ProtectedRoute>} />
      <Route path="/admin/stores" element={<ProtectedRoute requireAdmin={true}><StoresManagementScreen /></ProtectedRoute>} />
      <Route path="/admin/redemptions" element={<ProtectedRoute requireAdmin={true}><RedemptionsManagementScreen /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute requireAdmin={true}><OrdersManagementScreen /></ProtectedRoute>} />
      <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin={true}><AdminCouponsScreen /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute requireAdmin={true}><AdminLogsScreen /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requireAdmin={true}><AdminSettingsScreen /></ProtectedRoute>} />
      <Route path="/admin/rewards" element={<ProtectedRoute requireAdmin={true}><AdminRewardsScreen /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute requireAdmin={true}><AdminCategoriesScreen /></ProtectedRoute>} />
    </>
  );
};

export default AdminRoutes;
