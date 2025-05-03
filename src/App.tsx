
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { 
  AdminDashboard, UsersManagement, ProductsManagementScreen,
  StoresManagementScreen, RedemptionsManagementScreen, OrdersManagementScreen,
  CategoriesManagementScreen, SegmentsManagementScreen, PointsManagementScreen,
  ReportsScreen, AdminLogsScreen, AdminSettingsScreen,
  LoginScreen, SignUpScreen, WelcomeScreen, OnboardingScreen,
  ConsumerProfileScreen, VendorProfileScreen, StoreProfileScreen,
  HomeScreen, ProfileScreen, SearchScreen, RewardsScreen,
  RewardDetailScreen, StoreDetailScreen, ProductDetailScreen,
  CartScreen, CheckoutScreen, OrdersScreen, OrderDetailScreen,
  FavoritesScreen, ChatScreen, NotificationsScreen, SettingsScreen,
  NotFoundScreen, VendorDashboardScreen, VendorProductsScreen,
  VendorOrdersScreen, VendorCustomersScreen, VendorStoreDetailScreen,
  AuthProvider, ProtectedRoute, AdminRoute
} from './imports';
import { useAuth } from './context/AuthContext';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      // Simulate auth check delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      if (location.pathname !== '/login' && location.pathname !== '/signup' && !isAuthenticated) {
        navigate('/login');
      } else if (isAuthenticated && location.pathname === '/onboarding' && profile) {
        // Redirect away from onboarding if profile is set
        navigate('/home');
      }
      setLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, location.pathname, navigate, profile]);

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/auth/consumer-profile" element={<ConsumerProfileScreen />} />
        <Route path="/auth/vendor-profile" element={<VendorProfileScreen />} />
        <Route path="/auth/store-profile" element={<StoreProfileScreen />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/rewards" element={<RewardsScreen />} />
          <Route path="/rewards/detail/:id" element={<RewardDetailScreen />} />
          <Route path="/store/:storeId" element={<StoreDetailScreen />} />
          <Route path="/product/:productId" element={<ProductDetailScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/order/:orderId" element={<OrderDetailScreen />} />
          <Route path="/favorites" element={<FavoritesScreen />} />
          <Route path="/chat/:chatId" element={<ChatScreen />} />
          <Route path="/notifications" element={<NotificationsScreen />} />
          <Route path="/vendor-dashboard" element={<VendorDashboardScreen />} />
          <Route path="/vendor/products" element={<VendorProductsScreen />} />
          <Route path="/vendor/orders" element={<VendorOrdersScreen />} />
          <Route path="/vendor/customers" element={<VendorCustomersScreen />} />
          <Route path="/vendor/store/:storeId" element={<VendorStoreDetailScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/products" element={<ProductsManagementScreen />} />
          <Route path="/admin/stores" element={<StoresManagementScreen />} />
          <Route path="/admin/redemptions" element={<RedemptionsManagementScreen />} />
          <Route path="/admin/orders" element={<OrdersManagementScreen />} />
          <Route path="/admin/categories" element={<CategoriesManagementScreen />} />
          <Route path="/admin/segments" element={<SegmentsManagementScreen />} />
          <Route path="/admin/points" element={<PointsManagementScreen />} />
          <Route path="/admin/reports" element={<ReportsScreen />} />
          <Route path="/admin/logs" element={<AdminLogsScreen />} />
          <Route path="/admin/settings" element={<AdminSettingsScreen />} />
        </Route>

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
