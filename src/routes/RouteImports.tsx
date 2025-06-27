
import { lazy } from 'react';
import React from 'react';

// Public Routes
export const LoginScreen = lazy(() => import('../components/LoginScreen'));
export const SignUpScreen = lazy(() => import('../components/SignupScreen'));
export const ForgotPasswordScreen = React.lazy(() => import('@/components/auth/ForgotPasswordScreen'));
export const ResetPasswordScreen = React.lazy(() => import('@/components/auth/ResetPasswordScreen'));
export const OnboardingScreen = lazy(() => import('../components/OnboardingScreen'));

// Auth Routes
export const ProfileSelectionScreen = lazy(() => import('../components/auth/ProfileSelectionScreen'));
export const ProfessionalProfileScreen = lazy(() => import('../components/auth/ProfessionalProfileScreen'));

// User Routes
export const HomeScreen = lazy(() => import('../components/home/HomeScreen'));
export const MarketplaceScreen = lazy(() => import('../components/marketplace/MarketplaceScreen'));
export const ProdutoScreen = lazy(() => import('../components/marketplace/ProdutoScreen'));
export const CartScreen = lazy(() => import('../components/marketplace/CartScreen'));
export const CheckoutScreen = lazy(() => import('../components/marketplace/CheckoutScreen'));
export const OrderConfirmationScreen = lazy(() => import('../components/marketplace/OrderConfirmationScreen'));
export const MeusCuponsScreen = lazy(() => import('../components/cupons/MeusCuponsScreen'));

// Profile Routes
export const ProfileScreen = lazy(() => import('../components/profile/ProfileScreen'));
export const PointsHistoryScreen = lazy(() => import('../components/profile/PointsHistoryScreen'));
export const OrdersScreen = lazy(() => import('../components/profile/OrdersScreen'));
export const FavoritesScreen = lazy(() => import('../components/profile/FavoritesScreen'));
export const AddressScreen = lazy(() => import('../components/profile/AddressScreen'));
export const SettingsScreen = lazy(() => import('../components/profile/SettingsScreen'));

// Services imports
import ServicesScreen from '../components/services/ServicesScreen';
export { ServicesScreen };

// Quick access imports
import ComprasScreen from '../components/profile/ComprasScreen';
import EscanearScreen from '../components/scan/EscanearScreen';
import SuporteScreen from '../components/support/SuporteScreen';
export { ComprasScreen, EscanearScreen, SuporteScreen };

// Profile related imports
import OrderDetailScreen from '../components/profile/OrderDetailScreen';
import PhysicalPurchasesScreen from '../components/profile/PhysicalPurchasesScreen';
import ReferralsScreen from '../components/profile/ReferralsScreen';
import UserDataScreen from '../components/profile/UserDataScreen';
import ReviewsScreen from '../components/profile/ReviewsScreen';
export { 
  OrderDetailScreen, 
  PhysicalPurchasesScreen, 
  ReferralsScreen, 
  UserDataScreen, 
  ReviewsScreen 
};

// Rewards imports
import RewardsScreen from '../components/resgates/ResgatesScreen';
import RewardDetailScreen from '../components/resgates/ResgateDetailScreen';
import HistoricoResgatesScreen from '../components/resgates/HistoricoResgatesScreen';
export { RewardsScreen, RewardDetailScreen, HistoricoResgatesScreen };

// Store and Product imports
import StoreDetailScreen from '../components/marketplace/StoreDetailScreen';
export { StoreDetailScreen };

// Cart and Checkout imports (already exported above)

// Marketplace imports
import MarketplaceScreenWrapper from '../components/marketplace/MarketplaceScreenWrapper';
export { MarketplaceScreenWrapper };

// Admin Routes - Chunked separately
export const AdminDashboard = lazy(() => import('../components/admin/dashboard/AdminDashboard'));
export const UsersManagement = lazy(() => import('../components/admin/users/UserManagementScreen'));
export const ProductsManagementScreen = lazy(() => import('../components/admin/ProductsManagementScreen'));
export const StoresManagementScreen = lazy(() => import('../components/admin/stores/StoresManagementScreen'));
export const AdminCategoriesScreen = lazy(() => import('../components/admin/categories/AdminCategoriesScreen'));
export const AdminRewardsScreen = lazy(() => import('../components/admin/rewards/AdminRewardsScreen'));
export const CuponsVitrineScreen = lazy(() => import('../components/admin/cupons-vitrine/CuponsVitrineScreen'));

// Vendor Routes - Chunked separately
export const VendorHomeScreen = lazy(() => import('../components/vendor/VendorHomeScreen'));
export const VendorModeScreen = lazy(() => import('../components/vendor/VendorModeScreen'));
export const VendorOrdersScreen = lazy(() => import('../components/vendor/VendorOrdersScreen'));
export const ProductManagementScreen = lazy(() => import('../components/vendor/ProductManagementScreen'));
export const ProdutoFormScreen = lazy(() => import('../components/vendor/ProdutoFormScreen'));
export const ProdutoEditScreen = lazy(() => import('../components/vendor/ProdutoEditScreen'));
export const ClientesVendorScreen = lazy(() => import('../components/vendor/ClientesVendorScreen'));
export const ConfiguracoesVendorScreen = lazy(() => import('../components/vendor/ConfiguracoesVendorScreen'));
export const AjustePontosVendorScreen = lazy(() => import('../components/vendor/AjustePontosVendorScreen'));
export const VendorOrderDetailScreen = lazy(() => import('../components/vendor/VendorOrderDetailScreen'));

// Additional vendor screens
export const VendorDeliveryZonesScreen = lazy(() => import('../components/vendor/delivery/VendorDeliveryZonesScreen'));
export const ProductRestrictionsScreen = lazy(() => import('../components/vendor/delivery/ProductRestrictionsScreen'));
export const VendorStoreConfigScreen = lazy(() => import('../components/vendor/VendorStoreConfigScreen'));
export const VendorProfileScreen = lazy(() => import('../components/vendor/VendorProfileScreen'));
export const VendorGeneralSettingsScreen = lazy(() => import('../components/vendor/VendorGeneralSettingsScreen'));
export const VendorDeliverySettingsScreen = lazy(() => import('../components/vendor/VendorDeliverySettingsScreen'));
