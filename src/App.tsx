
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

// Vendor screens
import VendorHomeScreen from "./components/vendor/VendorHomeScreen";
import AjustePontosVendorScreen from "./components/vendor/AjustePontosVendorScreen";
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
