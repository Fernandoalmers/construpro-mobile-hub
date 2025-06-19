import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./hooks/use-cart";
import { ProtectedRoute, BottomTabNavigator } from "./imports";
import {
  LoginScreen,
  SignUpScreen,
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
  MarketplaceScreenWrapper,
  VendorModeScreen,
  ProductManagementScreen,
  ProdutoFormScreen,
  ProdutoEditScreen,
  ClientesVendorScreen,
  ConfiguracoesVendorScreen,
  AjustePontosVendorScreen,
  VendorOrderDetailScreen,
  VendorDeliveryZonesScreen,
  ProductRestrictionsScreen
} from './routes/RouteImports';
import ConviteScreen from './components/referral/ConviteScreen';
import AutoFixCodesPage from './pages/AutoFixCodes';
import {
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
import AdminCouponsScreen from './components/admin/coupons/AdminCouponsScreen';
import AdminLoyaltyDashboard from './components/admin/loyalty/AdminLoyaltyDashboard';
import OnboardingScreen from './components/OnboardingScreen';

const App = () => (
  <TooltipProvider>
    <Toaster />
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Public Routes */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/recuperar-senha" element={<ForgotPasswordScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          
          {/* Auth Routes */}
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
          
          {/* User Routes */}
          <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          
          {/* Referral invitation page - public access */}
          <Route path="/convite" element={<ConviteScreen />} />
          
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
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin={true}><UsersManagement /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute requireAdmin={true}><ProductsManagementScreen /></ProtectedRoute>} />
          <Route path="/admin/stores" element={<ProtectedRoute requireAdmin={true}><StoresManagementScreen /></ProtectedRoute>} />
          <Route path="/admin/redemptions" element={<ProtectedRoute requireAdmin={true}><RedemptionsManagementScreen /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute requireAdmin={true}><OrdersManagementScreen /></ProtectedRoute>} />
          <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin={true}><AdminCouponsScreen /></ProtectedRoute>} />
          <Route path="/admin/loyalty" element={<ProtectedRoute requireAdmin={true}><AdminLoyaltyDashboard /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute requireAdmin={true}><AdminLogsScreen /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin={true}><AdminSettingsScreen /></ProtectedRoute>} />
          <Route path="/admin/rewards" element={<ProtectedRoute requireAdmin={true}><AdminRewardsScreen /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute requireAdmin={true}><AdminCategoriesScreen /></ProtectedRoute>} />
          
          {/* Vendor Routes */}
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
          <Route path="/vendor/settings" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
          <Route path="/vendor/store-config" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
          
          {/* New delivery management routes */}
          <Route path="/vendor/delivery-zones" element={<ProtectedRoute><VendorDeliveryZonesScreen /></ProtectedRoute>} />
          <Route path="/vendor/product-restrictions" element={<ProtectedRoute><ProductRestrictionsScreen /></ProtectedRoute>} />
          
          {/* Portuguese aliases */}
          <Route path="/vendor/produtos" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
          <Route path="/vendor/clientes" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />
          <Route path="/vendor/ajuste-pontos" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />
          <Route path="/vendor/configuracoes" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
          
          {/* Legacy vendor routes */}
          <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
          <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
          
          {/* Auto Fix Routes */}
          <Route path="/auto-fix-codes" element={<AutoFixCodesPage />} />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Bottom Tab Navigator */}
        <BottomTabNavigator />
      </CartProvider>
    </AuthProvider>
  </TooltipProvider>
);

export default App;
