
import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../imports';
import {
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
  MarketplaceScreenWrapper
} from './RouteImports';
import ConviteScreen from '../components/referral/ConviteScreen';

const UserRoutes: React.FC = () => {
  return (
    <>
      {/* Main protected routes */}
      <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
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
    </>
  );
};

export default UserRoutes;
