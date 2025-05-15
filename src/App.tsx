
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { 
  AdminDashboard, UsersManagement, ProductsManagementScreen,
  StoresManagementScreen, RedemptionsManagementScreen, OrdersManagementScreen,
  AdminLogsScreen, LoginScreen, SignUpScreen, OnboardingScreen,
  HomeScreen, ProfileScreen, RewardsScreen,
  RewardDetailScreen, StoreDetailScreen, 
  CartScreen, CheckoutScreen, OrdersScreen, OrderDetailScreen,
  FavoritesScreen, ChatScreen, SettingsScreen,
  NotFoundScreen, VendorDashboardScreen, VendorProductsScreen,
  VendorCustomersScreen, AuthProvider, ProtectedRoute,
  MarketplaceScreenWrapper, AdminSettingsScreen, AdminRewardsScreen, 
  AdminCategoriesScreen, CartProvider
} from './imports';
import { useAuth } from './context/AuthContext';
import BottomTabNavigator from './components/layout/BottomTabNavigator';
import LoadingState from './components/common/LoadingState';
import PhysicalPurchasesScreen from './components/profile/PhysicalPurchasesScreen';
import PointsHistoryScreen from './components/profile/PointsHistoryScreen';
import AddressScreen from './components/profile/AddressScreen';
import VendorModeScreen from './components/vendor/VendorModeScreen';
import ProductManagementScreen from './components/vendor/ProductManagementScreen';
import ProdutoEditScreen from './components/vendor/ProdutoEditScreen';
import ProductFormScreen from './components/vendor/ProductFormScreen';
import ClientesVendorScreen from './components/vendor/ClientesVendorScreen';
import ConfiguracoesVendorScreen from './components/vendor/ConfiguracoesVendorScreen';
import AjustePontosVendorScreen from './components/vendor/AjustePontosVendorScreen';
import ProdutosVendorScreen from './components/vendor/ProdutosVendorScreen';
import ProdutoScreen from './components/marketplace/ProdutoScreen';
import OrderConfirmationScreen from './components/marketplace/OrderConfirmationScreen';
import ProfileSelectionScreen from './components/auth/ProfileSelectionScreen';
import ReferralsScreen from './components/profile/ReferralsScreen';
import VendorOrderDetailScreen from './components/vendor/VendorOrderDetailScreen';

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
    <CartProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />

        {/* Authentication flow routes */}
        <Route path="/auth/profile-selection" element={<ProtectedRoute><ProfileSelectionScreen /></ProtectedRoute>} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        
        {/* Profile related routes */}
        <Route path="/profile/orders" element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
        <Route path="/profile/orders/:id" element={<ProtectedRoute><OrderDetailScreen /></ProtectedRoute>} />
        <Route path="/profile/addresses" element={<ProtectedRoute><AddressScreen /></ProtectedRoute>} />
        <Route path="/profile/physical-purchases" element={<ProtectedRoute><PhysicalPurchasesScreen /></ProtectedRoute>} />
        <Route path="/profile/points-history" element={<ProtectedRoute><PointsHistoryScreen /></ProtectedRoute>} />
        <Route path="/profile/referrals" element={<ProtectedRoute><ReferralsScreen /></ProtectedRoute>} />
        <Route path="/profile/favorites" element={<ProtectedRoute><FavoritesScreen /></ProtectedRoute>} />
        <Route path="/profile/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        
        {/* Rewards related routes */}
        <Route path="/rewards" element={<ProtectedRoute><RewardsScreen /></ProtectedRoute>} />
        <Route path="/rewards/detail/:id" element={<ProtectedRoute><RewardDetailScreen /></ProtectedRoute>} />
        
        {/* Store and Product routes */}
        <Route path="/store/:storeId" element={<ProtectedRoute><StoreDetailScreen /></ProtectedRoute>} />
        <Route path="/produto/:id" element={<ProdutoScreen />} />
        <Route path="/product/:id" element={<ProdutoScreen />} />
        
        {/* Cart and Checkout routes */}
        <Route path="/cart" element={<ProtectedRoute><CartScreen /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutScreen /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
        <Route path="/order/:orderId" element={<ProtectedRoute><OrderDetailScreen /></ProtectedRoute>} />
        
        {/* Order confirmation route */}
        <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmationScreen /></ProtectedRoute>} />
        
        {/* Other user routes */}
        <Route path="/favorites" element={<ProtectedRoute><FavoritesScreen /></ProtectedRoute>} />
        <Route path="/chat/:chatId" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        
        {/* Vendor routes */}
        <Route path="/vendor" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
        <Route path="/vendor/product-new" element={<ProtectedRoute><ProductFormScreen /></ProtectedRoute>} />
        <Route path="/vendor/product-edit/:id" element={<ProtectedRoute><ProdutoEditScreen /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute><ProdutosVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/orders/:id" element={<ProtectedRoute><VendorOrderDetailScreen /></ProtectedRoute>} />
        <Route path="/vendor/customers" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/adjust-points" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/store-config" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
        
        {/* Aliases para manter compatibilidade com nomes em português */}
        <Route path="/vendor/produtos" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
        <Route path="/vendor/clientes" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/ajuste-pontos" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/configuracoes" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
        
        {/* Legacy vendor routes - keeping for backward compatibility */}
        <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
        
        {/* Marketplace routes */}
        <Route path="/marketplace" element={<ProtectedRoute><MarketplaceScreenWrapper /></ProtectedRoute>} />
        <Route path="/marketplace/products" element={<ProtectedRoute><MarketplaceScreenWrapper /></ProtectedRoute>} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin={true}><UsersManagement /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductsManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/stores" element={<ProtectedRoute requireAdmin={true}><StoresManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/redemptions" element={<ProtectedRoute requireAdmin={true}><RedemptionsManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute requireAdmin={true}><OrdersManagementScreen /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute requireAdmin={true}><AdminLogsScreen /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requireAdmin={true}><AdminSettingsScreen /></ProtectedRoute>} />
        <Route path="/admin/rewards" element={<ProtectedRoute requireAdmin={true}><AdminRewardsScreen /></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute requireAdmin={true}><AdminCategoriesScreen /></ProtectedRoute>} />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
      
      {shouldShowBottomNav() && <BottomTabNavigator />}
    </CartProvider>
  );
}

export default App;
