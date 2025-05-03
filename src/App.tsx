
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { 
  AdminDashboard, UsersManagement, ProductsManagementScreen,
  StoresManagementScreen, RedemptionsManagementScreen, OrdersManagementScreen,
  AdminLogsScreen, LoginScreen, SignUpScreen, OnboardingScreen,
  HomeScreen, ProfileScreen, RewardsScreen,
  RewardDetailScreen, StoreDetailScreen, ProductDetailScreen,
  CartScreen, CheckoutScreen, OrdersScreen, OrderDetailScreen,
  FavoritesScreen, ChatScreen, SettingsScreen,
  NotFoundScreen, VendorDashboardScreen, VendorProductsScreen,
  VendorCustomersScreen, AuthProvider, ProtectedRoute
} from './imports';
import { useAuth } from './context/AuthContext';
import BottomTabNavigator from './components/layout/BottomTabNavigator';
import LoadingState from './components/common/LoadingState';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  // Wait for auth to be checked before rendering app
  useEffect(() => {
    if (!isLoading) {
      setAppReady(true);
    }
  }, [isLoading]);

  // Debug routes and auth status
  useEffect(() => {
    console.log("App rendering. Path:", location.pathname, "Auth:", isAuthenticated, "Loading:", isLoading);
  }, [location.pathname, isAuthenticated, isLoading]);

  // Show loading state while authentication is being checked
  if (!appReady) {
    return <LoadingState text="Carregando aplicativo..." />;
  }

  // Helper function to determine if bottom navigation should be shown
  const shouldShowBottomNav = () => {
    // Don't show on admin routes, auth routes, or specific pages
    return !location.pathname.startsWith('/admin') && 
           !location.pathname.includes('/auth/') &&
           location.pathname !== '/login' &&
           location.pathname !== '/signup' &&
           location.pathname !== '/welcome' &&
           location.pathname !== '/onboarding' &&
           location.pathname !== '/splash';
  };

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><RewardsScreen /></ProtectedRoute>} />
        <Route path="/rewards/detail/:id" element={<ProtectedRoute><RewardDetailScreen /></ProtectedRoute>} />
        <Route path="/store/:storeId" element={<ProtectedRoute><StoreDetailScreen /></ProtectedRoute>} />
        <Route path="/product/:productId" element={<ProtectedRoute><ProductDetailScreen /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartScreen /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutScreen /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
        <Route path="/order/:orderId" element={<ProtectedRoute><OrderDetailScreen /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><FavoritesScreen /></ProtectedRoute>} />
        <Route path="/chat/:chatId" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
        <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorDashboardScreen /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute><VendorProductsScreen /></ProtectedRoute>} />
        <Route path="/vendor/customers" element={<ProtectedRoute><VendorCustomersScreen /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />

        {/* Admin routes - using ProtectedRoute with requireAdmin flag */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin={true}><UsersManagement /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductsManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/stores" element={<ProtectedRoute requireAdmin={true}><StoresManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/redemptions" element={<ProtectedRoute requireAdmin={true}><RedemptionsManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute requireAdmin={true}><OrdersManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute requireAdmin={true}><AdminLogsScreen /></ProtectedRoute>} />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
      
      {shouldShowBottomNav() && <BottomTabNavigator />}
    </>
  );
}

export default App;
