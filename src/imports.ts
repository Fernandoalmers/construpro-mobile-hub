
// Core and Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import UsersManagement from './components/admin/UsersManagement';
import ProductsManagementScreen from './components/admin/products/ProductsManagementScreen';
import StoresManagementScreen from './components/admin/stores/StoresManagementScreen';
import RedemptionsManagementScreen from './components/admin/redemptions/RedemptionsManagementScreen';
import OrdersManagementScreen from './components/admin/orders/OrdersManagementScreen';
import CategoriesManagementScreen from './components/admin/categories/CategoriesManagementScreen';
import SegmentsManagementScreen from './components/admin/segments/SegmentsManagementScreen';
import PointsManagementScreen from './components/admin/points/PointsManagementScreen';
import ReportsScreen from './components/admin/reports/ReportsScreen';
import AdminLogsScreen from './components/admin/logs/AdminLogsScreen';
import AdminSettingsScreen from './components/admin/settings/AdminSettingsScreen';

// Auth Components
import LoginScreen from './components/auth/LoginScreen';
import SignUpScreen from './components/auth/SignUpScreen';
import WelcomeScreen from './components/auth/WelcomeScreen';
import OnboardingScreen from './components/auth/OnboardingScreen';
import ConsumerProfileScreen from './components/auth/ConsumerProfileScreen';
import VendorProfileScreen from './components/auth/VendorProfileScreen';
import StoreProfileScreen from './components/auth/StoreProfileScreen';

// Main App Components
import HomeScreen from './components/screens/HomeScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import SearchScreen from './components/screens/SearchScreen';
import RewardsScreen from './components/screens/RewardsScreen';
import RewardDetailScreen from './components/screens/RewardDetailScreen';
import StoreDetailScreen from './components/screens/StoreDetailScreen';
import ProductDetailScreen from './components/screens/ProductDetailScreen';
import CartScreen from './components/screens/CartScreen';
import CheckoutScreen from './components/screens/CheckoutScreen';
import OrdersScreen from './components/screens/OrdersScreen';
import OrderDetailScreen from './components/screens/OrderDetailScreen';
import FavoritesScreen from './components/screens/FavoritesScreen';
import ChatScreen from './components/screens/ChatScreen';
import NotificationsScreen from './components/screens/NotificationsScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import NotFoundScreen from './components/screens/NotFoundScreen';

// Vendor Components
import VendorDashboardScreen from './components/vendor/VendorDashboardScreen';
import VendorProductsScreen from './components/vendor/VendorProductsScreen';
import VendorOrdersScreen from './components/vendor/VendorOrdersScreen';
import VendorCustomersScreen from './components/vendor/VendorCustomersScreen';
import VendorStoreDetailScreen from './components/vendor/VendorStoreDetailScreen';

// Auth Context and Route Protection
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import AdminRoute from './components/routes/AdminRoute';

export {
  // Admin Components
  AdminDashboard,
  UsersManagement,
  ProductsManagementScreen,
  StoresManagementScreen,
  RedemptionsManagementScreen,
  OrdersManagementScreen,
  CategoriesManagementScreen,
  SegmentsManagementScreen,
  PointsManagementScreen,
  ReportsScreen,
  AdminLogsScreen,
  AdminSettingsScreen,
  
  // Auth Components
  LoginScreen,
  SignUpScreen,
  WelcomeScreen,
  OnboardingScreen,
  ConsumerProfileScreen,
  VendorProfileScreen,
  StoreProfileScreen,
  
  // Main App Components
  HomeScreen,
  ProfileScreen,
  SearchScreen,
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
  NotificationsScreen,
  SettingsScreen,
  NotFoundScreen,
  
  // Vendor Components
  VendorDashboardScreen,
  VendorProductsScreen,
  VendorOrdersScreen,
  VendorCustomersScreen,
  VendorStoreDetailScreen,
  
  // Auth Context and Route Protection
  AuthProvider,
  ProtectedRoute,
  AdminRoute
};
