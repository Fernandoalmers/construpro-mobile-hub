
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import ProdutoEditScreen from './components/vendor/ProdutoEditScreen';
import ClientesVendorScreen from './components/vendor/ClientesVendorScreen';
import ConfiguracoesVendorScreen from './components/vendor/ConfiguracoesVendorScreen';
import ChatScreen from './components/chat/ChatScreen';
import ChatDetailScreen from './components/chat/ChatDetailScreen';
import { AuthProvider } from './context/AuthContext';
import ProfessionalRegistrationScreen from './components/services/ProfessionalRegistrationScreen';
import ProfessionalProfileScreen from './components/services/ProfessionalProfileScreen';
import ProjectDetailScreen from './components/services/ProjectDetailScreen';
import CompletedServicesScreen from './components/services/CompletedServicesScreen';
import ContractedProjectsScreen from './components/services/ContractedProjectsScreen';
import ServiceCalendarScreen from './components/services/ServiceCalendarScreen';
import { Toaster } from '@/components/ui/sonner';
import BottomTabNavigator from './components/layout/BottomTabNavigator';

function App() {
  // Define a default value for isProfessional
  const defaultProfessionalValue = false;

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          
          {/* Auth Routes */}
          <Route path="/auth/profile-selection" element={<ProfileSelectionScreen />} />
          <Route path="/auth/professional-profile" element={<ProfessionalRegistrationScreen />} />
          <Route path="/auth/vendor-profile" element={<VendorProfileScreen />} />
          
          {/* Home */}
          <Route path="/home/*" element={<HomeScreenWrapper />} />
          
          {/* Profile */}
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/profile/user-data" element={<UserDataScreen />} />
          <Route path="/profile/addresses" element={<AddressScreen />} />
          <Route path="/profile/orders" element={<OrdersScreen />} />
          <Route path="/profile/order/:id" element={<OrderDetailScreen />} />
          <Route path="/profile/physical-purchases" element={<PhysicalPurchasesScreen />} />
          <Route path="/profile/points" element={<PointsHistoryScreen />} />
          <Route path="/profile/favorites" element={<FavoritesScreen />} />
          <Route path="/profile/referrals" element={<ReferralsScreen />} />
          <Route path="/profile/reviews" element={<ReviewsScreen />} />
          <Route path="/profile/settings" element={<SettingsScreen />} />
          
          {/* Marketplace */}
          <Route path="/marketplace/*" element={<MarketplaceScreenWrapper />} />
          <Route path="/produto/:id" element={<ProdutoDetailScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          
          {/* Services */}
          <Route path="/services/*" element={<ServicesTabNavigator />}>
            <Route path="" element={<ServicesAvailableScreen isProfessional={defaultProfessionalValue} />} />
            <Route path="available" element={<ServicesAvailableScreen isProfessional={defaultProfessionalValue} />} />
            <Route path="my-services" element={<MyServicesScreen isProfessional={defaultProfessionalValue} />} />
            <Route path="my-proposals" element={<MyProposalsScreen />} />
            <Route path="calendar" element={<ServiceCalendarScreen />} />
            <Route path="completed" element={<CompletedServicesScreen isProfessional={defaultProfessionalValue} />} />
          </Route>
          <Route path="/services/request/:id" element={<ServiceRequestDetailScreen />} />
          <Route path="/services/create" element={<CreateServiceRequestScreen />} />
          <Route path="/services/professional-profile" element={<ProfessionalProfileScreen />} />
          <Route path="/services/project/:id" element={<ProjectDetailScreen />} />
          <Route path="/services/contracted" element={<ContractedProjectsScreen isProfessional={defaultProfessionalValue} />} />
          
          {/* Rewards */}
          <Route path="/resgates" element={<ResgatesScreen />} />
          <Route path="/resgate/:id" element={<ResgateDetailScreen />} />
          <Route path="/historico-resgates" element={<HistoricoResgatesScreen />} />
          
          {/* Vendor Mode */}
          <Route path="/vendor" element={<VendorModeScreen />} />
          <Route path="/vendor/home" element={<VendorHomeScreen />} />
          <Route path="/vendor/adjust-points" element={<AjustePontosVendorScreen />} />
          <Route path="/vendor/products" element={<ProductManagementScreen />} />
          <Route path="/vendor/product-form" element={<ProductFormScreen />} />
          <Route path="/vendor/product-edit/:id" element={<ProductFormScreen />} />
          <Route path="/vendor/product-clone" element={<ProductFormScreen />} />
          <Route path="/vendor/customers" element={<ClientesVendorScreen />} />
          <Route path="/vendor/store-config" element={<ConfiguracoesVendorScreen />} />
          <Route path="/vendor/orders" element={<ProdutosVendorScreen />} />
          
          {/* Chat */}
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/chat/:id" element={<ChatDetailScreen />} />
          
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        <BottomTabNavigator />
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
