
// User Route Imports
export { HomeScreen } from './LazyRoutes';
export { ProfileScreen } from './LazyRoutes';
export { MeusCuponsScreen } from './LazyRoutes';

// Services imports
import ServicesScreen from '../components/services/ServicesScreen';
export { ServicesScreen };

// Quick access imports
import ComprasScreen from '../components/profile/ComprasScreen';
import EscanearScreen from '../components/scan/EscanearScreen';
import SuporteScreen from '../components/support/SuporteScreen';
export { ComprasScreen, EscanearScreen, SuporteScreen };

// Profile related imports
import OrdersScreen from '../components/profile/OrdersScreen';
import OrderDetailScreen from '../components/profile/OrderDetailScreen';
import AddressScreen from '../components/profile/AddressScreen';
import PhysicalPurchasesScreen from '../components/profile/PhysicalPurchasesScreen';
import PointsHistoryScreen from '../components/profile/PointsHistoryScreen';
import ReferralsScreen from '../components/profile/ReferralsScreen';
import FavoritesScreen from '../components/profile/FavoritesScreen';
import SettingsScreen from '../components/profile/SettingsScreen';
import UserDataScreen from '../components/profile/UserDataScreen';
import ReviewsScreen from '../components/profile/ReviewsScreen';
export { 
  OrdersScreen, 
  OrderDetailScreen, 
  AddressScreen, 
  PhysicalPurchasesScreen, 
  PointsHistoryScreen, 
  ReferralsScreen, 
  FavoritesScreen, 
  SettingsScreen, 
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
export { ProdutoScreen } from './LazyRoutes';

// Cart and Checkout imports
export { CartScreen } from './LazyRoutes';
export { CheckoutScreen } from './LazyRoutes';
export { OrderConfirmationScreen } from './LazyRoutes';

// Marketplace imports
import MarketplaceScreenWrapper from '../components/marketplace/MarketplaceScreenWrapper';
export { MarketplaceScreenWrapper };
