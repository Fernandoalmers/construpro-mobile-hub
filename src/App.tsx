
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import components
import SplashScreen from "./components/SplashScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen";
import BottomTabNavigator from "./components/layout/BottomTabNavigator";

// Main screens
import HomeScreen from "./components/home/HomeScreen";
import MarketplaceScreen from "./components/marketplace/MarketplaceScreen";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Flow */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignupScreen />} />
          
          {/* Main Flow */}
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/marketplace" element={<MarketplaceScreen />} />
          <Route path="/produto/:id" element={<ProdutoDetailScreen />} />
          <Route path="/cart" element={<CartScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/resgates" element={<ResgatesScreen />} />
          <Route path="/historico-resgates" element={<HistoricoResgatesScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/chat/:id" element={<ChatDetailScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          
          {/* Vendor Flow */}
          <Route path="/vendor" element={<VendorHomeScreen />} />
          <Route path="/vendor/ajuste-pontos" element={<AjustePontosVendorScreen />} />
          
          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomTabNavigator />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
