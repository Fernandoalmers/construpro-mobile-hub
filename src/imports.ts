
// Core and Admin Components
import AdminDashboard from './components/admin/dashboard/AdminDashboard';
import UsersManagement from './components/admin/UsersManagement';
import ProductsManagementScreen from './components/admin/ProductsManagement';
import StoresManagementScreen from './components/admin/stores/StoresManagementScreen';
import RedemptionsManagementScreen from './components/admin/redemptions/RedemptionsManagementScreen';
import OrdersManagementScreen from './components/admin/orders/OrdersManagementScreen';
import CategoriesManagementScreen from './components/admin/CategoriesManagementScreen';
import SegmentsManagementScreen from './components/admin/SegmentsManagementScreen';
import PointsManagementScreen from './components/admin/PointsManagementScreen';
import ReportsScreen from './components/admin/ReportsScreen';
import AdminLogsScreen from './components/admin/AdminLogs';
import AdminSettingsScreen from './components/admin/AdminSettingsScreen';

// Auth Components
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignupScreen';
import WelcomeScreen from './components/WelcomeScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ConsumerProfileScreen from './components/ConsumerProfileScreen';
import VendorProfileScreen from './components/vendor/VendorProfileScreen';
import StoreProfileScreen from './components/StoreProfileScreen';

// Main App Components
import HomeScreen from './components/home/HomeScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import SearchScreen from './components/SearchScreen';
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
import NotificationsScreen from './components/NotificationsScreen';
import SettingsScreen from './components/profile/SettingsScreen';
import NotFoundScreen from './pages/NotFound';

// Vendor Components
import VendorDashboardScreen from './components/vendor/VendorHomeScreen';
import VendorProductsScreen from './components/vendor/ProdutosVendorScreen';
import VendorOrdersScreen from './components/vendor/VendorOrdersScreen';
import VendorCustomersScreen from './components/vendor/ClientesVendorScreen';
import VendorStoreDetailScreen from './components/vendor/VendorStoreDetailScreen';

// Auth Context and Route Protection
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
