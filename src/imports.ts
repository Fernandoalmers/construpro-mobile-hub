

// Common
export { default as LoadingState } from './components/common/LoadingState';

// Layout
export { default as BottomTabNavigator } from './components/layout/BottomTabNavigator';

// Admin
export { default as AdminDashboard } from './components/admin/dashboard/AdminDashboard';
export { default as UsersManagement } from './components/admin/UsersManagement';
export { default as ProductsManagementScreen } from './components/admin/ProductsManagementScreen';
export { default as StoresManagementScreen } from './components/admin/stores/StoresManagementScreen';
export { default as RedemptionsManagementScreen } from './components/admin/redemptions/RedemptionsManagementScreen';
export { default as OrdersManagementScreen } from './components/admin/orders/OrdersManagementScreen';
export { default as AdminLogsScreen } from './components/admin/AdminLogs';
export { default as AdminSettingsScreen } from './components/admin/settings/AdminSettingsScreen';
export { default as AdminRewardsScreen } from './components/admin/rewards/AdminRewardsScreen';
export { default as AdminCategoriesScreen } from './components/admin/categories/AdminCategoriesScreen';

// Auth components
export { AuthProvider } from './context/AuthContext';
export { default as ProtectedRoute } from './components/auth/ProtectedRoute';
export { default as LoginScreen } from './components/LoginScreen';
export { default as SignUpScreen } from './components/SignupScreen';
export { default as OnboardingScreen } from './components/OnboardingScreen';

// Home
export { default as HomeScreen } from './components/home/HomeScreen';

// Profile
export { default as ProfileScreen } from './components/profile/ProfileScreen';
export { default as UserDataScreen } from './components/profile/UserDataScreen';
export { default as ComprasScreen } from './components/profile/ComprasScreen';
export { default as ReviewsScreen } from './components/profile/ReviewsScreen';

// Support and Scan
export { default as SuporteScreen } from './components/support/SuporteScreen';
export { default as EscanearScreen } from './components/scan/EscanearScreen';

// Services
export { default as ServicesScreen } from './components/services/ServicesScreen';

// Rewards
export { default as RewardsScreen } from './components/resgates/ResgatesScreen';
export { default as RewardDetailScreen } from './components/resgates/ResgateDetailScreen';
export { default as HistoricoResgatesScreen } from './components/resgates/HistoricoResgatesScreen';

// Store
// Updating the StoreDetailScreen import path to match existing file structure
export { default as StoreDetailScreen } from './components/marketplace/ProdutoScreen';

// Cart
export { default as CartScreen } from './components/marketplace/CartScreen';
export { default as CheckoutScreen } from './components/marketplace/CheckoutScreen';
// Fix CartProvider export - import from the CartContext hook file
export { CartProvider } from './hooks/use-cart';

// Orders
export { default as OrdersScreen } from './components/profile/OrdersScreen';
export { default as OrderDetailScreen } from './components/profile/OrderDetailScreen';
export { default as OrderConfirmationScreen } from './components/marketplace/OrderConfirmationScreen';

// Favorites
export { default as FavoritesScreen } from './components/profile/FavoritesScreen';

// Chat components - Adicionando o export correto do ChatScreen
export { default as ChatScreen } from './components/chat/ChatScreen';
export { default as ChatDetailScreen } from './components/chat/ChatDetailScreen';

// Settings
export { default as SettingsScreen } from './components/profile/SettingsScreen';

// Not Found
export { default as NotFoundScreen } from './pages/NotFound';

// Vendor
export { default as VendorDashboardScreen } from './components/vendor/VendorModeScreen';
export { default as VendorCustomersScreen } from './components/vendor/ClientesVendorScreen';
export { default as VendorOrderDetailScreen } from './components/vendor/VendorOrderDetailScreen';
export { default as VendorOrdersScreen } from './components/vendor/VendorOrdersScreen';
export { getProductSegments } from './services/admin/productSegmentsService';
export { default as ProductSegmentSelect } from './components/vendor/ProductSegmentSelect';

// Marketplace
export { default as MarketplaceScreenWrapper } from './components/marketplace/MarketplaceScreenWrapper';

