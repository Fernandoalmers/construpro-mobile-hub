
// Core and Admin Components
import AdminDashboard from './components/admin/dashboard/AdminDashboard';
import UsersManagement from './components/admin/UsersManagement';
import ProductsManagementScreen from './components/admin/ProductsManagement';
import StoresManagementScreen from './components/admin/stores/StoresManagementScreen';
import RedemptionsManagementScreen from './components/admin/redemptions/RedemptionsManagementScreen';
import OrdersManagementScreen from './components/admin/orders/OrdersManagementScreen';
import AdminLogsScreen from './components/admin/AdminLogs';
import AdminSettingsScreen from './components/admin/settings/AdminSettingsScreen';
import AdminRewardsScreen from './components/admin/rewards/AdminRewardsScreen';
import AdminCategoriesScreen from './components/admin/categories/AdminCategoriesScreen';

// Auth Components
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignupScreen';
import OnboardingScreen from './components/auth/OnboardingScreen';

// Main App Components
import HomeScreen from './components/home/HomeScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import RewardsScreen from './components/resgates/ResgatesScreen';
import RewardDetailScreen from './components/resgates/ResgateDetailScreen';
import StoreDetailScreen from './components/marketplace/ProdutoScreen';
import ProductDetailScreen from './components/marketplace/ProdutoDetailScreen';
import CartScreen from './components/marketplace/CartScreen';
import CheckoutScreen from './components/marketplace/CheckoutScreen';
import OrdersScreen from './components/profile/OrdersScreen';
import OrderDetailScreen from './components/profile/OrderDetailScreen';
import FavoritesScreen from './components/profile/FavoritesScreen';
import ChatScreen from './components/chat/ChatScreen';
import SettingsScreen from './components/profile/SettingsScreen';
import NotFoundScreen from './pages/NotFound';
import MarketplaceScreenWrapper from './components/marketplace/MarketplaceScreenWrapper';

// Profile Related Components
import PhysicalPurchasesScreen from './components/profile/PhysicalPurchasesScreen';
import PointsHistoryScreen from './components/profile/PointsHistoryScreen';
import AddressScreen from './components/profile/AddressScreen';
import ReferralsScreen from './components/profile/ReferralsScreen';

// Vendor Components
import VendorDashboardScreen from './components/vendor/VendorHomeScreen';
import VendorProductsScreen from './components/vendor/ProdutosVendorScreen';
import VendorCustomersScreen from './components/vendor/ClientesVendorScreen';

// Auth Context and Route Protection
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './hooks/use-cart';
import ProtectedRoute from './components/auth/ProtectedRoute';

export {
  // Admin Components
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
  
  // Auth Components
  LoginScreen,
  SignUpScreen,
  OnboardingScreen,
  
  // Main App Components
  HomeScreen,
  ProfileScreen,
  RewardsScreen,
  RewardDetailScreen,
  StoreDetailScreen,
  ProductDetailScreen,
  CartScreen,
  CheckoutScreen,
  OrdersScreen,
  OrderDetailScreen,
  FavoritesScreen,
  ChatScreen,
  SettingsScreen,
  NotFoundScreen,
  MarketplaceScreenWrapper,
  
  // Profile Related Components
  PhysicalPurchasesScreen,
  PointsHistoryScreen,
  AddressScreen,
  ReferralsScreen,
  
  // Vendor Components
  VendorDashboardScreen,
  VendorProductsScreen,
  VendorCustomersScreen,
  
  // Auth Context and Route Protection
  AuthProvider,
  CartProvider,
  ProtectedRoute
};
