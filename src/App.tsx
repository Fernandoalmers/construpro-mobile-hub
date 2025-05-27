
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './hooks/use-cart';
import { HomeScreen } from './components/home/HomeScreen';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignupScreen';
import ProfileScreen from './components/profile/ProfileScreen';
import AddressScreen from './components/profile/AddressScreen';
import OrdersScreen from './components/profile/OrdersScreen';
import OrderDetailScreen from './components/profile/OrderDetailScreen';
import RewardsScreen from './components/resgates/ResgatesScreen';
import ReferralsScreen from './components/profile/ReferralsScreen';
import MarketplaceScreen from './components/marketplace/MarketplaceScreen';
import { ProductDetails } from './components/marketplace/components/ProductDetails';
import CartScreen from './components/marketplace/CartScreen';
import CheckoutScreen from './components/marketplace/CheckoutScreen';
import { AdminDashboard } from './components/admin/dashboard/AdminDashboard';
import { AdminProductsScreen } from './components/admin/products/AdminProductsScreen';
import { AdminUsersScreen } from './components/admin/users/UserManagementScreen';
import { AdminStoresScreen } from './components/admin/stores/StoresManagementScreen';
import { AdminRedemptionsScreen } from './components/admin/redemptions/RedemptionsManagementScreen';
import { AdminRewardsScreen } from './components/admin/rewards/AdminRewardsScreen';
import { AdminCategoriesScreen } from './components/admin/categories/AdminCategoriesScreen';
import { AdminOrdersScreen } from './components/admin/orders/OrdersManagementScreen';
import AdminLogsScreen from './components/admin/AdminLogs';
import { AdminSettingsScreen } from './components/admin/settings/AdminSettingsScreen';
import ProfessionalProfileScreen from './components/auth/ProfessionalProfileScreen';
import ServicesScreen from './components/services/ServicesScreen';
import AdminCouponsScreen from './components/admin/coupons/AdminCouponsScreen';

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeScreen />,
  },
  {
    path: "/home",
    element: <HomeScreen />,
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
  {
    path: "/register",
    element: <SignUpScreen />,
  },
  {
    path: "/profile",
    element: <ProfileScreen />,
  },
  {
    path: "/profile/address",
    element: <AddressScreen />,
  },
  {
    path: "/profile/address/add",
    element: <AddressScreen />,
  },
  {
    path: "/profile/address/:id",
    element: <AddressScreen />,
  },
  {
    path: "/profile/orders",
    element: <OrdersScreen />,
  },
   {
    path: "/profile/orders/:id",
    element: <OrderDetailScreen />,
  },
  {
    path: "/profile/rewards",
    element: <RewardsScreen />,
  },
  {
    path: "/profile/referrals",
    element: <ReferralsScreen />,
  },
  {
    path: "/marketplace",
    element: <MarketplaceScreen />,
  },
  {
    path: "/marketplace/product/:id",
    element: <ProductDetails />,
  },
  {
    path: "/cart",
    element: <CartScreen />,
  },
  {
    path: "/checkout",
    element: <CheckoutScreen />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
  {
    path: "/admin/products",
    element: <AdminProductsScreen />,
  },
  {
    path: "/admin/users",
    element: <AdminUsersScreen />,
  },
  {
    path: "/admin/stores",
    element: <AdminStoresScreen />,
  },
  {
    path: "/admin/redemptions",
    element: <AdminRedemptionsScreen />,
  },
  {
    path: "/admin/rewards",
    element: <AdminRewardsScreen />,
  },
  {
    path: "/admin/categories",
    element: <AdminCategoriesScreen />,
  },
  {
    path: "/admin/orders",
    element: <AdminOrdersScreen />,
  },
  {
    path: "/admin/logs",
    element: <AdminLogsScreen />,
  },
  {
    path: "/admin/settings",
    element: <AdminSettingsScreen />,
  },
  {
    path: "/auth/professional-profile",
    element: <ProfessionalProfileScreen />
  },
  {
    path: "/services",
    element: <ServicesScreen />
  },
  {
    path: "/admin/coupons",
    element: <AdminCouponsScreen />
  },
]);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
