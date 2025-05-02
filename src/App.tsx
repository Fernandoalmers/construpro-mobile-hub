
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import components
import SplashScreen from "./components/SplashScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen";
import BottomTabNavigator from "./components/layout/BottomTabNavigator";

// Main screens with wrappers
import HomeScreenWrapper from "./components/home/HomeScreenWrapper";
import MarketplaceScreenWrapper from "./components/marketplace/MarketplaceScreenWrapper";
import ProdutoDetailScreen from "./components/marketplace/ProdutoDetailScreen";
import CartScreen from "./components/marketplace/CartScreen";
import CheckoutScreen from "./components/marketplace/CheckoutScreen";
import ResgatesScreen from "./components/resgates/ResgatesScreen";
import HistoricoResgatesScreen from "./components/resgates/HistoricoResgatesScreen";
import ChatScreen from "./components/chat/ChatScreen";
import ChatDetailScreen from "./components/chat/ChatDetailScreen";
import ProfileScreen from "./components/profile/ProfileScreen";

// Profile section screens
import OrdersScreen from "./components/profile/OrdersScreen";
import OrderDetailScreen from "./components/profile/OrderDetailScreen";
import PointsHistoryScreen from "./components/profile/PointsHistoryScreen";
import PhysicalPurchasesScreen from "./components/profile/PhysicalPurchasesScreen";
import FavoritesScreen from "./components/profile/FavoritesScreen";
import ReferralsScreen from "./components/profile/ReferralsScreen";
import ReviewsScreen from "./components/profile/ReviewsScreen";
import SettingsScreen from "./components/profile/SettingsScreen";
import UserDataScreen from "./components/profile/UserDataScreen";

// Service screens
import ServicesTabNavigator from "./components/services/ServicesTabNavigator";
import ServiceRequestDetailScreen from "./components/services/ServiceRequestDetailScreen";
import ProjectDetailScreen from "./components/services/ProjectDetailScreen";
import ProfessionalProfileScreen from "./components/services/ProfessionalProfileScreen";
import ProfessionalRegistrationScreen from "./components/services/ProfessionalRegistrationScreen";

// Vendor screens
import VendorHomeScreen from "./components/vendor/VendorHomeScreen";
import AjustePontosVendorScreen from "./components/vendor/AjustePontosVendorScreen";
import ClientesVendorScreen from "./components/vendor/ClientesVendorScreen";
import ProdutosVendorScreen from "./components/vendor/ProdutosVendorScreen";
import ProdutoFormScreen from "./components/vendor/ProdutoFormScreen";
import ProdutoEditScreen from "./components/vendor/ProdutoEditScreen";
import ConfiguracoesVendorScreen from "./components/vendor/ConfiguracoesVendorScreen";
import ErrorBoundary from "./components/common/ErrorBoundary";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children, requiredRoles = [], redirectTo = '/login' }) => {
  const { user, isLoading, isPublicRoute } = useAuth();
  const location = useLocation();
  
  // Se a rota for pública, não é necessária autenticação
  if (isPublicRoute(location.pathname)) {
    return children;
  }
  
  if (isLoading) {
    return null;
  }
  
  if (!user) {
    return <Navigate to={redirectTo} />;
  }
  
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.papel)) {
    return user.papel === 'lojista' 
      ? <Navigate to="/vendor" /> 
      : <Navigate to="/home" />;
  }
  
  return children;
};

// Role-specific routes
const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        
        <Route path="/home" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <HomeScreenWrapper />
          </ProtectedRoute>
        } />
        <Route path="/marketplace" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <MarketplaceScreenWrapper />
          </ProtectedRoute>
        } />
        <Route path="/produto/:id" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ProdutoDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <CartScreen />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <CheckoutScreen />
          </ProtectedRoute>
        } />
        <Route path="/resgates" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ResgatesScreen />
          </ProtectedRoute>
        } />
        <Route path="/historico-resgates" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <HistoricoResgatesScreen />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional', 'lojista']}>
            <ChatScreen />
          </ProtectedRoute>
        } />
        <Route path="/chat/:id" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional', 'lojista']}>
            <ChatDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional', 'lojista']}>
            <ProfileScreen />
          </ProtectedRoute>
        } />
        
        {/* Profile Section Routes */}
        <Route path="/profile/orders" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <OrdersScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/orders/:id" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <OrderDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/points" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <PointsHistoryScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/physical-purchases" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <PhysicalPurchasesScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/favorites" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <FavoritesScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/referrals" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ReferralsScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/reviews" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ReviewsScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/settings" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <SettingsScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile/user-data" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <UserDataScreen />
          </ProtectedRoute>
        } />
        
        {/* Services Routes */}
        <Route path="/services" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ServicesTabNavigator />
          </ProtectedRoute>
        } />
        <Route path="/services/request/:id" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ServiceRequestDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/services/project/:id" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ProjectDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/services/professional/:id" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ProfessionalProfileScreen />
          </ProtectedRoute>
        } />
        <Route path="/services/register-professional" element={
          <ProtectedRoute requiredRoles={['consumidor', 'profissional']}>
            <ProfessionalRegistrationScreen />
          </ProtectedRoute>
        } />
        
        {/* Vendor Routes */}
        <Route path="/vendor" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <VendorHomeScreen />
          </ProtectedRoute>
        } />
        <Route path="/vendor/ajuste-pontos" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <AjustePontosVendorScreen />
          </ProtectedRoute>
        } />
        <Route path="/vendor/clientes" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <ClientesVendorScreen />
          </ProtectedRoute>
        } />
        <Route path="/vendor/clientes/:id/extrato" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <ClientesVendorScreen />
          </ProtectedRoute>
        } />
        <Route path="/vendor/produtos" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <ProdutosVendorScreen />
          </ProtectedRoute>
        } />
        <Route path="/vendor/produtos/novo" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <ProdutoFormScreen />
          </ProtectedRoute>
        } />
        <Route path="/vendor/produtos/editar/:id" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <ProdutoEditScreen />
          </ProtectedRoute>
        } />
        <Route path="/vendor/configuracoes" element={
          <ProtectedRoute requiredRoles={['lojista']}>
            <ConfiguracoesVendorScreen />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <BottomTabNavigator />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
