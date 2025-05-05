
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import MarketplaceScreen from '@/components/marketplace/MarketplaceScreen';
import { ThemeProvider } from "@/components/theme-provider";
import CartPage from './pages/CartPage';
import ProfileScreen from '@/components/profile/ProfileScreen';
import AdminLayout from '@/components/admin/AdminLayout';
import StoresManagementScreen from '@/components/admin/stores/StoresManagementScreen';
import AdminSettingsScreen from '@/components/admin/settings/AdminSettingsScreen';
import AdminRewardsScreen from '@/components/admin/rewards/AdminRewardsScreen';
import RedemptionsManagementScreen from '@/components/admin/redemptions/RedemptionsManagementScreen';

// Using ProdutoScreen instead of creating ProductScreen
import ProdutoScreen from '@/components/marketplace/ProdutoScreen';

// Using LoginScreen from the components folder directly, not auth subfolder
import LoginScreen from '@/components/LoginScreen';
import SignUpScreen from '@/components/SignupScreen';

// We'll import these from marketplace for checkout functionality
import CheckoutScreen from '@/components/marketplace/CheckoutScreen';  
import OrderConfirmationScreen from '@/components/marketplace/OrderConfirmationScreen';

// Import AdminDashboard instead of AdminDashboardScreen
import AdminDashboard from '@/components/admin/dashboard/AdminDashboard';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
      <Routes>
        <Route path="/" element={<MarketplaceScreen />} />
        <Route path="/marketplace" element={<MarketplaceScreen />} />
        <Route path="/produto/:productId" element={<ProdutoScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<SignUpScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/checkout" element={<CheckoutScreen />} />
        <Route path="/order-confirmation" element={<OrderConfirmationScreen />} />
        <Route path="/cart" element={<CartPage />} />
        
        {/* Admin routes with currentSection prop */}
        <Route path="/admin" element={<AdminLayout currentSection="dashboard"><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/dashboard" element={<AdminLayout currentSection="dashboard"><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/lojas" element={<AdminLayout currentSection="stores"><StoresManagementScreen /></AdminLayout>} />
        <Route path="/admin/configuracoes" element={<AdminLayout currentSection="settings"><AdminSettingsScreen /></AdminLayout>} />
        <Route path="/admin/recompensas" element={<AdminLayout currentSection="rewards"><AdminRewardsScreen /></AdminLayout>} />
        <Route path="/admin/resgates" element={<AdminLayout currentSection="redemptions"><RedemptionsManagementScreen /></AdminLayout>} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
