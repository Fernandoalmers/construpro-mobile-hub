import { lazy } from 'react';

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

// Profile Routes
export const ProfileScreen = lazy(() => import('../components/profile/ProfileScreen'));
export const PointsHistoryScreen = lazy(() => import('../components/profile/PointsHistoryScreen'));
export const OrdersScreen = lazy(() => import('../components/profile/OrdersScreen'));
export const FavoritesScreen = lazy(() => import('../components/profile/FavoritesScreen'));
export const AddressScreen = lazy(() => import('../components/profile/AddressScreen'));
export const SettingsScreen = lazy(() => import('../components/profile/SettingsScreen'));

// Admin Routes - Chunked separately
export const AdminDashboard = lazy(() => import('../components/admin/dashboard/AdminDashboard'));
export const UsersManagement = lazy(() => import('../components/admin/users/UserManagementScreen'));
export const ProductsManagementScreen = lazy(() => import('../components/admin/ProductsManagementScreen'));
export const StoresManagementScreen = lazy(() => import('../components/admin/stores/StoresManagementScreen'));
export const AdminCategoriesScreen = lazy(() => import('../components/admin/categories/AdminCategoriesScreen'));
export const AdminRewardsScreen = lazy(() => import('../components/admin/rewards/AdminRewardsScreen'));

// Vendor Routes - Chunked separately
export const VendorHomeScreen = lazy(() => import('../components/vendor/VendorHomeScreen'));
export const VendorOrdersScreen = lazy(() => import('../components/vendor/VendorOrdersScreen'));
export const ProductManagementScreen = lazy(() => import('../components/vendor/ProductManagementScreen'));
export const ClientesVendorScreen = lazy(() => import('../components/vendor/ClientesVendorScreen'));
