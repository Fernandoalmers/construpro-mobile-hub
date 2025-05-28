import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './imports';
import BottomTabNavigator from './components/layout/BottomTabNavigator';
import LoadingState from './components/common/LoadingState';
import { NotFoundScreen } from './routes/RouteImports';
import { shouldShowBottomNavigation } from './utils/navigationUtils';

// Import individual route components instead of using wrapper components
import {
  LoginScreen,
  SignUpScreen,
  OnboardingScreen,
  ForgotPasswordScreen,
  ProfileSelectionScreen,
  ProfessionalProfileScreen,
  HomeScreen,
  ProfileScreen,
  ServicesScreen,
  ComprasScreen,
  EscanearScreen,
  SuporteScreen,
  OrdersScreen,
  OrderDetailScreen,
  AddressScreen,
  PhysicalPurchasesScreen,
  PointsHistoryScreen,
  ReferralsScreen,
  FavoritesScreen,
  SettingsScreen,
  UserDataScreen,
  ReviewsScreen,
  RewardsScreen,
  RewardDetailScreen,
  HistoricoResgatesScreen,
  StoreDetailScreen,
  ProdutoScreen,
  CartScreen,
  CheckoutScreen,
  OrderConfirmationScreen,
  VendorModeScreen,
  ProductManagementScreen,
  ProdutoFormScreen,
  ProdutoEditScreen,
  ClientesVendorScreen,
  ConfiguracoesVendorScreen,
  AjustePontosVendorScreen,
  VendorOrderDetailScreen,
  MarketplaceScreenWrapper
} from './routes/RouteImports';

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
  AdminCategoriesScreen,
  VendorOrdersScreen
} from './imports';

function App() {
  const location = useLocation();
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

  return (
    <CartProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        
        {/* Authentication flow routes */}
        <Route path="/auth/profile-selection" element={
          <ProtectedRoute>
            <ProfileSelectionScreen />
          </ProtectedRoute>
        } />
        <Route path="/auth/professional-profile" element={
          <ProtectedRoute>
            <ProfessionalProfileScreen />
          </ProtectedRoute>
        } />
        
        {/* Main protected routes */}
        <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
        
        {/* Services screen for professionals */}
        <Route path="/services" element={<ProtectedRoute><ServicesScreen /></ProtectedRoute>} />
        
        {/* Quick Access Routes */}
        <Route path="/compras" element={<ProtectedRoute><ComprasScreen /></ProtectedRoute>} />
        <Route path="/escanear" element={<ProtectedRoute><EscanearScreen /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><EscanearScreen /></ProtectedRoute>} />
        <Route path="/suporte" element={<ProtectedRoute><SuporteScreen /></ProtectedRoute>} />
        
        {/* Profile related routes */}
        <Route path="/profile/orders" element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
        <Route path="/profile/orders/:id" element={<ProtectedRoute><OrderDetailScreen /></ProtectedRoute>} />
        <Route path="/profile/addresses" element={<ProtectedRoute><AddressScreen /></ProtectedRoute>} />
        <Route path="/profile/address/add" element={<ProtectedRoute><AddressScreen /></ProtectedRoute>} />
        <Route path="/profile/physical-purchases" element={<ProtectedRoute><PhysicalPurchasesScreen /></ProtectedRoute>} />
        <Route path="/profile/points-history" element={<ProtectedRoute><PointsHistoryScreen /></ProtectedRoute>} />
        <Route path="/profile/referrals" element={<ProtectedRoute><ReferralsScreen /></ProtectedRoute>} />
        <Route path="/profile/favorites" element={<ProtectedRoute><FavoritesScreen /></ProtectedRoute>} />
        <Route path="/profile/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        <Route path="/profile/user-data" element={<ProtectedRoute><UserDataScreen /></ProtectedRoute>} />
        <Route path="/profile/reviews" element={<ProtectedRoute><ReviewsScreen /></ProtectedRoute>} />
        
        {/* Rewards related routes */}
        <Route path="/rewards" element={<ProtectedRoute><RewardsScreen /></ProtectedRoute>} />
        <Route path="/rewards/detail/:id" element={<ProtectedRoute><RewardDetailScreen /></ProtectedRoute>} />
        <Route path="/resgate/:id" element={<ProtectedRoute><RewardDetailScreen /></ProtectedRoute>} />
        <Route path="/resgates" element={<ProtectedRoute><HistoricoResgatesScreen /></ProtectedRoute>} />
        <Route path="/historico-resgates" element={<ProtectedRoute><HistoricoResgatesScreen /></ProtectedRoute>} />
        
        {/* Store and Product routes */}
        <Route path="/store/:storeId" element={<ProtectedRoute><StoreDetailScreen /></ProtectedRoute>} />
        <Route path="/produto/:id" element={<ProdutoScreen />} />
        <Route path="/product/:id" element={<ProdutoScreen />} />
        
        {/* Cart and Checkout routes */}
        <Route path="/cart" element={<ProtectedRoute><CartScreen /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutScreen /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersScreen /></ProtectedRoute>} />
        <Route path="/order/:orderId" element={<ProtectedRoute><OrderDetailScreen /></ProtectedRoute>} />
        
        {/* Order confirmation routes */}
        <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmationScreen /></ProtectedRoute>} />
        <Route path="/order/confirmacao/:orderId" element={<ProtectedRoute><OrderConfirmationScreen /></ProtectedRoute>} />
        <Route path="/marketplace/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmationScreen /></ProtectedRoute>} />
        
        {/* Other user routes */}
        <Route path="/favorites" element={<ProtectedRoute><FavoritesScreen /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        
        {/* Marketplace routes */}
        <Route path="/marketplace" element={<ProtectedRoute><MarketplaceScreenWrapper /></ProtectedRoute>} />
        <Route path="/marketplace/products" element={<ProtectedRoute><MarketplaceScreenWrapper /></ProtectedRoute>} />

        {/* Vendor routes */}
        <Route path="/vendor" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
        <Route path="/vendor/products/new" element={<ProtectedRoute><ProdutoFormScreen /></ProtectedRoute>} />
        <Route path="/vendor/product-new" element={<ProtectedRoute><ProdutoFormScreen /></ProtectedRoute>} />
        
        {/* Product edit routes */}
        <Route path="/vendor/product-edit/:id" element={<ProtectedRoute><ProdutoEditScreen /></ProtectedRoute>} />
        <Route path="/vendor/products/edit/:id" element={<ProtectedRoute><ProdutoEditScreen /></ProtectedRoute>} />
        
        <Route path="/vendor/orders" element={<ProtectedRoute><VendorOrdersScreen /></ProtectedRoute>} />
        <Route path="/vendor/orders/:id" element={<ProtectedRoute><VendorOrderDetailScreen /></ProtectedRoute>} />
        <Route path="/vendor/customers" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/adjust-points" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/store-config" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
        
        {/* Portuguese aliases */}
        <Route path="/vendor/produtos" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
        <Route path="/vendor/clientes" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/ajuste-pontos" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />
        <Route path="/vendor/configuracoes" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
        
        {/* Legacy vendor routes */}
        <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
        <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />

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
      
      {shouldShowBottomNavigation(location.pathname) && <BottomTabNavigator />}
    </CartProvider>
  );
}

export default App;
