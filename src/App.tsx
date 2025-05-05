
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MarketplaceScreen from './components/marketplace/MarketplaceScreen';
import ProdutoScreen from './components/marketplace/ProdutoScreen';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './hooks/use-cart';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import CartPage from './pages/CartPage';
import ProfileScreen from './components/profile/ProfileScreen';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardScreen from './components/admin/dashboard/AdminDashboard';
import StoresManagementScreen from './components/admin/stores/StoresManagementScreen';
import AdminSettingsScreen from './components/admin/settings/AdminSettingsScreen';
import AdminRewardsScreen from './components/admin/rewards/AdminRewardsScreen';
import RedemptionsManagementScreen from './components/admin/redemptions/RedemptionsManagementScreen';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MarketplaceScreen />} />
              <Route path="/marketplace" element={<MarketplaceScreen />} />
              <Route path="/produto/:productId" element={<ProdutoScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/cart" element={<CartPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout currentSection="dashboard"><AdminDashboardScreen /></AdminLayout>} />
              <Route path="/admin/dashboard" element={<AdminLayout currentSection="dashboard"><AdminDashboardScreen /></AdminLayout>} />
              <Route path="/admin/lojas" element={<AdminLayout currentSection="stores"><StoresManagementScreen /></AdminLayout>} />
              <Route path="/admin/configuracoes" element={<AdminLayout currentSection="settings"><AdminSettingsScreen /></AdminLayout>} />
              <Route path="/admin/recompensas" element={<AdminLayout currentSection="rewards"><AdminRewardsScreen /></AdminLayout>} />
              <Route path="/admin/resgates" element={<AdminLayout currentSection="redemptions"><RedemptionsManagementScreen /></AdminLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
