
import React from 'react';
import { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
// Removed duplicate Toaster import from sonner
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import HomeScreenWrapper from './components/home/HomeScreenWrapper';
import ProfileSelectionScreen from './components/auth/ProfileSelectionScreen';
import VendorProfileScreen from './components/auth/VendorProfileScreen';
import ForgotPasswordScreen from './components/auth/ForgotPasswordScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import UserDataScreen from './components/profile/UserDataScreen';
import AddressScreen from './components/profile/AddressScreen';
import OrdersScreen from './components/profile/OrdersScreen';
import OrderDetailScreen from './components/profile/OrderDetailScreen';
import PhysicalPurchasesScreen from './components/profile/PhysicalPurchasesScreen';
import PointsHistoryScreen from './components/profile/PointsHistoryScreen';
import FavoritesScreen from './components/profile/FavoritesScreen';
import ReferralsScreen from './components/profile/ReferralsScreen';
import ReviewsScreen from './components/profile/ReviewsScreen';
import SettingsScreen from './components/profile/SettingsScreen';
import MarketplaceScreenWrapper from './components/marketplace/MarketplaceScreenWrapper';
import ProdutoDetailScreen from './components/marketplace/ProdutoDetailScreen';
import CartScreen from './components/marketplace/CartScreen';
import CheckoutScreen from './components/marketplace/CheckoutScreen';
import ServicesTabNavigator from './components/services/ServicesTabNavigator';
import ServicesAvailableScreen from './components/services/ServicesAvailableScreen';
import MyServicesScreen from './components/services/MyServicesScreen';
import MyProposalsScreen from './components/services/MyProposalsScreen';
import ServiceRequestDetailScreen from './components/services/ServiceRequestDetailScreen';
import CreateServiceRequestScreen from './components/services/CreateServiceRequestScreen';
import ResgatesScreen from './components/resgates/ResgatesScreen';
import ResgateDetailScreen from './components/resgates/ResgateDetailScreen';
import HistoricoResgatesScreen from './components/resgates/HistoricoResgatesScreen';
import VendorModeScreen from './components/vendor/VendorModeScreen';
import VendorHomeScreen from './components/vendor/VendorHomeScreen';
import AjustePontosVendorScreen from './components/vendor/AjustePontosVendorScreen';
import ProdutosVendorScreen from './components/vendor/ProdutosVendorScreen';
import ProductManagementScreen from './components/vendor/ProductManagementScreen';
import ProductFormScreen from './components/vendor/ProductFormScreen';
import ClientesVendorScreen from './components/vendor/ClientesVendorScreen';
import ConfiguracoesVendorScreen from './components/vendor/ConfiguracoesVendorScreen';
import ChatScreen from './components/chat/ChatScreen';
import ChatDetailScreen from './components/chat/ChatDetailScreen';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './hooks/use-cart';
import ProfessionalRegistrationScreen from './components/services/ProfessionalRegistrationScreen';
import ProfessionalProfileScreen from './components/services/ProfessionalProfileScreen';
import ProjectDetailScreen from './components/services/ProjectDetailScreen';
import CompletedServicesScreen from './components/services/CompletedServicesScreen';
import ContractedProjectsScreen from './components/services/ContractedProjectsScreen';
import ServiceCalendarScreen from './components/services/ServiceCalendarScreen';
import { Toaster } from '@/components/ui/sonner';
import BottomTabNavigator from './components/layout/BottomTabNavigator';
import QRCodeScreen from './components/QRCodeScreen';

// Import Protected Route
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import admin components from our imports file
import {
  AdminDashboard,
  UserManagementScreen as AdminUserManagementScreen,
  ProductsManagement as AdminProductsManagement,
  StoresManagementScreen as AdminStoresManagementScreen,
  RedemptionsManagementScreen as AdminRedemptionsManagementScreen,
  OrdersManagementScreen as AdminOrdersManagementScreen,
  AdminLogs
} from './imports';

// QueryClient for React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Define a default value for isProfessional
  const defaultProfessionalValue = false;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<SplashScreen />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
              
              {/* Auth Routes - Protected to ensure proper profile selection flow */}
              <Route path="/auth/profile-selection" element={
                <ProtectedRoute requireAuth={true}>
                  <ProfileSelectionScreen />
                </ProtectedRoute>
              } />
              <Route path="/auth/professional-profile" element={
                <ProtectedRoute requireAuth={true}>
                  <ProfessionalRegistrationScreen />
                </ProtectedRoute>
              } />
              <Route path="/auth/vendor-profile" element={
                <ProtectedRoute requireAuth={true}>
                  <VendorProfileScreen />
                </ProtectedRoute>
              } />
              
              {/* Home - Protected */}
              <Route path="/home/*" element={
                <ProtectedRoute requireAuth={true}>
                  <HomeScreenWrapper />
                </ProtectedRoute>
              } />
              <Route path="/qrcode" element={
                <ProtectedRoute requireAuth={true}>
                  <QRCodeScreen />
                </ProtectedRoute>
              } />
              
              {/* Profile - Protected */}
              <Route path="/profile" element={
                <ProtectedRoute requireAuth={true}>
                  <ProfileScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/user-data" element={
                <ProtectedRoute requireAuth={true}>
                  <UserDataScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/addresses" element={
                <ProtectedRoute requireAuth={true}>
                  <AddressScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/orders" element={
                <ProtectedRoute requireAuth={true}>
                  <OrdersScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/order/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <OrderDetailScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/physical-purchases" element={
                <ProtectedRoute requireAuth={true}>
                  <PhysicalPurchasesScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/points" element={
                <ProtectedRoute requireAuth={true}>
                  <PointsHistoryScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/favorites" element={
                <ProtectedRoute requireAuth={true}>
                  <FavoritesScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/referrals" element={
                <ProtectedRoute requireAuth={true}>
                  <ReferralsScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/reviews" element={
                <ProtectedRoute requireAuth={true}>
                  <ReviewsScreen />
                </ProtectedRoute>
              } />
              <Route path="/profile/settings" element={
                <ProtectedRoute requireAuth={true}>
                  <SettingsScreen />
                </ProtectedRoute>
              } />
              
              {/* Marketplace - Protected */}
              <Route path="/marketplace/*" element={
                <ProtectedRoute requireAuth={true}>
                  <MarketplaceScreenWrapper />
                </ProtectedRoute>
              } />
              <Route path="/produto/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <ProdutoDetailScreen />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute requireAuth={true}>
                  <CartScreen />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute requireAuth={true}>
                  <CheckoutScreen />
                </ProtectedRoute>
              } />
              
              {/* Services - Protected */}
              <Route path="/services/*" element={
                <ProtectedRoute requireAuth={true}>
                  <ServicesTabNavigator />
                </ProtectedRoute>
              }>
                <Route path="" element={<ServicesAvailableScreen isProfessional={defaultProfessionalValue} />} />
                <Route path="available" element={<ServicesAvailableScreen isProfessional={defaultProfessionalValue} />} />
                <Route path="my-services" element={<MyServicesScreen isProfessional={defaultProfessionalValue} />} />
                <Route path="my-proposals" element={<MyProposalsScreen />} />
                <Route path="calendar" element={<ServiceCalendarScreen />} />
                <Route path="completed" element={<CompletedServicesScreen isProfessional={defaultProfessionalValue} />} />
              </Route>
              <Route path="/services/request/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <ServiceRequestDetailScreen />
                </ProtectedRoute>
              } />
              <Route path="/services/create" element={
                <ProtectedRoute requireAuth={true}>
                  <CreateServiceRequestScreen />
                </ProtectedRoute>
              } />
              <Route path="/services/professional-profile" element={
                <ProtectedRoute requireAuth={true}>
                  <ProfessionalProfileScreen />
                </ProtectedRoute>
              } />
              <Route path="/services/project/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <ProjectDetailScreen />
                </ProtectedRoute>
              } />
              <Route path="/services/contracted" element={
                <ProtectedRoute requireAuth={true}>
                  <ContractedProjectsScreen isProfessional={defaultProfessionalValue} />
                </ProtectedRoute>
              } />
              
              {/* Rewards - Protected */}
              <Route path="/resgates" element={
                <ProtectedRoute requireAuth={true}>
                  <ResgatesScreen />
                </ProtectedRoute>
              } />
              <Route path="/resgate/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <ResgateDetailScreen />
                </ProtectedRoute>
              } />
              <Route path="/historico-resgates" element={
                <ProtectedRoute requireAuth={true}>
                  <HistoricoResgatesScreen />
                </ProtectedRoute>
              } />
              
              {/* Vendor Mode - Protected */}
              <Route path="/vendor" element={
                <ProtectedRoute requireAuth={true}>
                  <VendorModeScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/home" element={
                <ProtectedRoute requireAuth={true}>
                  <VendorHomeScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/adjust-points" element={
                <ProtectedRoute requireAuth={true}>
                  <AjustePontosVendorScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/products" element={
                <ProtectedRoute requireAuth={true}>
                  <ProductManagementScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/product-form" element={
                <ProtectedRoute requireAuth={true}>
                  <ProductFormScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/product-edit/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <ProductFormScreen isEditing />
                </ProtectedRoute>
              } />
              <Route path="/vendor/product-clone" element={
                <ProtectedRoute requireAuth={true}>
                  <ProductFormScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/customers" element={
                <ProtectedRoute requireAuth={true}>
                  <ClientesVendorScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/store-config" element={
                <ProtectedRoute requireAuth={true}>
                  <ConfiguracoesVendorScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendor/orders" element={
                <ProtectedRoute requireAuth={true}>
                  <ProdutosVendorScreen />
                </ProtectedRoute>
              } />
              
              {/* Chat - Protected */}
              <Route path="/chat" element={
                <ProtectedRoute requireAuth={true}>
                  <ChatScreen />
                </ProtectedRoute>
              } />
              <Route path="/chat/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <ChatDetailScreen />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminUserManagementScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminProductsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores"
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminStoresManagementScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/redemptions"
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminRedemptionsManagementScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminOrdersManagementScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute requireAuth={true} requireAdmin={true}>
                    <AdminLogs />
                  </ProtectedRoute>
                }
              />
              
              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
          <BottomTabNavigator />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
