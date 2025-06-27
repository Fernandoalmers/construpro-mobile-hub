
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { AdminRoute } from '../components/routes/AdminRoute';
import LoadingState from '@/components/common/LoadingState';
import {
  AdminDashboard,
  UsersManagement,
  ProductsManagementScreen,
  StoresManagementScreen,
  AdminCategoriesScreen,
  AdminRewardsScreen,
  AdminCouponsScreen
} from './LazyRoutes';

// Import smaller admin components directly
import RedemptionsManagementScreen from '../components/admin/redemptions/RedemptionsManagementScreen';
import OrdersManagementScreen from '../components/admin/orders/OrdersManagementScreen';
import AdminLogsScreen from '../components/admin/AdminLogs';
import AdminSettingsScreen from '../components/admin/settings/AdminSettingsScreen';
import AdminLoyaltyDashboard from '../components/admin/loyalty/AdminLoyaltyDashboard';
import SecurityDashboard from '../components/admin/security/SecurityDashboard';

const AdminLoadingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingState text="Carregando painel administrativo..." />}>
    {children}
  </Suspense>
);

const AdminRoutes: React.FC = () => {
  return (
    <>
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <AdminDashboard />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      <Route path="/admin/dashboard" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <AdminDashboard />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <UsersManagement />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      <Route path="/admin/products" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <ProductsManagementScreen />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      <Route path="/admin/stores" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <StoresManagementScreen />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      <Route path="/admin/categories" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <AdminCategoriesScreen />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      <Route path="/admin/rewards" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <AdminRewardsScreen />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      <Route path="/admin/cupons" element={
        <AdminRoute>
          <AdminLoadingWrapper>
            <AdminCouponsScreen />
          </AdminLoadingWrapper>
        </AdminRoute>
      } />
      
      {/* Smaller admin components - direct import */}
      <Route path="/admin/redemptions" element={<AdminRoute><RedemptionsManagementScreen /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><OrdersManagementScreen /></AdminRoute>} />
      <Route path="/admin/logs" element={<AdminRoute><AdminLogsScreen /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettingsScreen /></AdminRoute>} />
      <Route path="/admin/loyalty" element={<AdminRoute><AdminLoyaltyDashboard /></AdminRoute>} />
      <Route path="/admin/security" element={<AdminRoute><SecurityDashboard /></AdminRoute>} />
    </>
  );
};

export default AdminRoutes;
