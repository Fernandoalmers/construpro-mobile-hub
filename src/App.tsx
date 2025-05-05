
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MarketplaceScreen from '@/components/marketplace/MarketplaceScreen';
import ProductScreen from '@/components/marketplace/ProductScreen';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/hooks/use-cart';
import LoginScreen from '@/components/auth/LoginScreen';
import RegisterScreen from '@/components/auth/RegisterScreen';
import ProfileScreen from '@/components/profile/ProfileScreen';
import CheckoutScreen from '@/components/checkout/CheckoutScreen';
import OrderConfirmationScreen from '@/components/checkout/OrderConfirmationScreen';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboardScreen from '@/components/admin/AdminDashboardScreen';
import StoresManagementScreen from '@/components/admin/stores/StoresManagementScreen';
import AdminSettingsScreen from '@/components/admin/settings/AdminSettingsScreen';
import AdminRewardsScreen from '@/components/admin/rewards/AdminRewardsScreen';
import RedemptionsManagementScreen from '@/components/admin/redemptions/RedemptionsManagementScreen';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from "@/components/theme-provider"
import CartPage from './pages/CartPage';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MarketplaceScreen />} />
              <Route path="/marketplace" element={<MarketplaceScreen />} />
              <Route path="/produto/:productId" element={<ProductScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/checkout" element={<CheckoutScreen />} />
              <Route path="/order-confirmation" element={<OrderConfirmationScreen />} />
              <Route path="/cart" element={<CartPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout><AdminDashboardScreen /></AdminLayout>} />
              <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboardScreen /></AdminLayout>} />
              <Route path="/admin/lojas" element={<AdminLayout><StoresManagementScreen /></AdminLayout>} />
              <Route path="/admin/configuracoes" element={<AdminLayout><AdminSettingsScreen /></AdminLayout>} />
              <Route path="/admin/recompensas" element={<AdminLayout><AdminRewardsScreen /></AdminLayout>} />
              <Route path="/admin/resgates" element={<AdminLayout><RedemptionsManagementScreen /></AdminLayout>} />
            </Routes>
          </Router>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
