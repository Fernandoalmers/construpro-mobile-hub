
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../imports';
import LoadingState from '@/components/common/LoadingState';
import {
  AdminDashboard,
  UsersManagement,
  ProductsManagementScreen,
  StoresManagementScreen,
  AdminCategoriesScreen,
  AdminRewardsScreen
} from './LazyRoutes';

// Import remaining admin components directly for now (smaller components)
import RedemptionsManagementScreen from '../components/admin/redemptions/RedemptionsManagementScreen';
import OrdersManagementScreen from '../components/admin/orders/OrdersManagementScreen';
import AdminLogsScreen from '../components/admin/AdminLogs';
import AdminSettingsScreen from '../components/admin/settings/AdminSettingsScreen';
import AdminCouponsScreen from '../components/admin/coupons/AdminCouponsScreen';
import AdminLoyaltyDashboard from '../components/admin/loyalty/AdminLoyaltyDashboard';

const AdminLoadingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingState text="Carregando painel admin..." />}>
    {children}
  </Suspense>
);

const AdminRoutes: React.FC = () => {
  return (
    <>
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminLoadingWrapper>
            <AdminDashboard />
          </AdminLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminLoadingWrapper>
            <UsersManagement />
          </AdminLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminLoadingWrapper>
            <ProductsManagementScreen />
          </AdminLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/admin/stores" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminLoadingWrapper>
            <StoresManagementScreen />
          </AdminLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminLoadingWrapper>
            <AdminCategoriesScreen />
          </AdminLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/admin/rewards" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminLoadingWrapper>
            <AdminRewardsScreen />
          </AdminLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/admin/redemptions" element={<ProtectedRoute requireAdmin={true}><RedemptionsManagementScreen /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute requireAdmin={true}><OrdersManagementScreen /></ProtectedRoute>} />
      <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin={true}><AdminCouponsScreen /></ProtectedRoute>} />
      <Route path="/admin/loyalty" element={<ProtectedRoute requireAdmin={true}><AdminLoyaltyDashboard /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute requireAdmin={true}><AdminLogsScreen /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requireAdmin={true}><AdminSettingsScreen /></ProtectedRoute>} />
    </>
  );
};

export default AdminRoutes;
