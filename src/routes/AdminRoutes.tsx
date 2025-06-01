
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
  return [
    <Route key="admin" path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />,
    <Route key="admin-users" path="/admin/users" element={<ProtectedRoute requireAdmin={true}><UsersManagement /></ProtectedRoute>} />,
    <Route key="admin-products" path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductsManagementScreen /></ProtectedRoute>} />,
    <Route key="admin-stores" path="/admin/stores" element={<ProtectedRoute requireAdmin={true}><StoresManagementScreen /></ProtectedRoute>} />,
    <Route key="admin-redemptions" path="/admin/redemptions" element={<ProtectedRoute requireAdmin={true}><RedemptionsManagementScreen /></ProtectedRoute>} />,
    <Route key="admin-orders" path="/admin/orders" element={<ProtectedRoute requireAdmin={true}><OrdersManagementScreen /></ProtectedRoute>} />,
    <Route key="admin-coupons" path="/admin/coupons" element={<ProtectedRoute requireAdmin={true}><AdminCouponsScreen /></ProtectedRoute>} />,
    <Route key="admin-logs" path="/admin/logs" element={<ProtectedRoute requireAdmin={true}><AdminLogsScreen /></ProtectedRoute>} />,
    <Route key="admin-settings" path="/admin/settings" element={<ProtectedRoute requireAdmin={true}><AdminSettingsScreen /></ProtectedRoute>} />,
    <Route key="admin-rewards" path="/admin/rewards" element={<ProtectedRoute requireAdmin={true}><AdminRewardsScreen /></ProtectedRoute>} />,
    <Route key="admin-categories" path="/admin/categories" element={<ProtectedRoute requireAdmin={true}><AdminCategoriesScreen /></ProtectedRoute>} />
  ];
};

export default AdminRoutes;
