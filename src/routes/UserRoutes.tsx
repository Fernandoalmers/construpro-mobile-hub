
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../imports';
import LoadingState from '@/components/common/LoadingState';
import {
  HomeScreen,
  MarketplaceScreen,
  ProdutoScreen,
  CartScreen,
  CheckoutScreen,
  OrderConfirmationScreen,
  ProfileScreen,
  PointsHistoryScreen,
  OrdersScreen,
  FavoritesScreen,
  AddressScreen,
  SettingsScreen,
  MeusCuponsScreen
} from './LazyRoutes';

// Import directly as they are smaller components
import ConviteScreen from '../components/referral/ConviteScreen';
import ResgatesScreen from '../components/resgates/ResgatesScreen';
import ResgateDetailScreen from '../components/resgates/ResgateDetailScreen';
import HistoricoResgatesScreen from '../components/resgates/HistoricoResgatesScreen';
import SuporteScreen from '../components/support/SuporteScreen';
import EscanearScreen from '../components/scan/EscanearScreen';
import ServicesScreen from '../components/services/ServicesScreen';
import ProfessionalRegistrationScreen from '../components/services/ProfessionalRegistrationScreen';
import ChatScreen from '../components/chat/ChatScreen';
import ChatDetailScreen from '../components/chat/ChatDetailScreen';
import ComprasScreen from '../components/profile/ComprasScreen';
import PhysicalPurchasesScreen from '../components/profile/PhysicalPurchasesScreen';
import UserDataScreen from '../components/profile/UserDataScreen';
import ReviewsScreen from '../components/profile/ReviewsScreen';
import ReferralsScreen from '../components/profile/ReferralsScreen';
import OrderDetailScreen from '../components/profile/OrderDetailScreen';

const UserLoadingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingState text="Carregando..." />}>
    {children}
  </Suspense>
);

const UserRoutes: React.FC = () => {
  return (
    <>
      <Route path="/home" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <HomeScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/marketplace" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <MarketplaceScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/produto/:id" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <ProdutoScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/carrinho" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <CartScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <CheckoutScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/order-confirmation/:orderId" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <OrderConfirmationScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <ProfileScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/profile/points" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <PointsHistoryScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/profile/orders" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <OrdersScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/profile/favorites" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <FavoritesScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/profile/address" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <AddressScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      <Route path="/profile/settings" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <SettingsScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      
      {/* Meus Cupons */}
      <Route path="/meus-cupons" element={
        <ProtectedRoute>
          <UserLoadingWrapper>
            <MeusCuponsScreen />
          </UserLoadingWrapper>
        </ProtectedRoute>
      } />
      
      {/* Smaller components - direct import */}
      <Route path="/convite" element={<ProtectedRoute><ConviteScreen /></ProtectedRoute>} />
      <Route path="/resgates" element={<ProtectedRoute><ResgatesScreen /></ProtectedRoute>} />
      <Route path="/resgate/:id" element={<ProtectedRoute><ResgateDetailScreen /></ProtectedRoute>} />
      <Route path="/historico-resgates" element={<ProtectedRoute><HistoricoResgatesScreen /></ProtectedRoute>} />
      <Route path="/suporte" element={<ProtectedRoute><SuporteScreen /></ProtectedRoute>} />
      <Route path="/escanear" element={<ProtectedRoute><EscanearScreen /></ProtectedRoute>} />
      <Route path="/servicos" element={<ProtectedRoute><ServicesScreen /></ProtectedRoute>} />
      <Route path="/cadastro-profissional" element={<ProtectedRoute><ProfessionalRegistrationScreen /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
      <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatDetailScreen /></ProtectedRoute>} />
      <Route path="/compras" element={<ProtectedRoute><ComprasScreen /></ProtectedRoute>} />
      <Route path="/compras-fisicas" element={<ProtectedRoute><PhysicalPurchasesScreen /></ProtectedRoute>} />
      <Route path="/meus-dados" element={<ProtectedRoute><UserDataScreen /></ProtectedRoute>} />
      <Route path="/avaliacoes" element={<ProtectedRoute><ReviewsScreen /></ProtectedRoute>} />
      <Route path="/indicacoes" element={<ProtectedRoute><ReferralsScreen /></ProtectedRoute>} />
      <Route path="/pedido/:id" element={<ProtectedRoute><OrderDetailScreen /></ProtectedRoute>} />
    </>
  );
};

export default UserRoutes;
