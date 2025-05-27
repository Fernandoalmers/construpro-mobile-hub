import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './hooks/use-cart';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { EditAddress } from './components/profile/EditAddress';
import { AddAddress } from './components/profile/AddAddress';
import { AddressList } from './components/profile/AddressList';
import { OrdersScreen } from './components/profile/OrdersScreen';
import { OrderDetailsScreen } from './components/profile/OrderDetailsScreen';
import { RewardsScreen } from './components/profile/RewardsScreen';
import { ReferralsScreen } from './components/profile/ReferralsScreen';
import { MarketplaceScreen } from './components/marketplace/MarketplaceScreen';
import { ProductDetails } from './components/marketplace/ProductDetails';
import { CartScreen } from './components/marketplace/CartScreen';
import { CheckoutScreen } from './components/marketplace/CheckoutScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProductsScreen } from './components/admin/products/AdminProductsScreen';
import { AdminUsersScreen } from './components/admin/AdminUsersScreen';
import { AdminStoresScreen } from './components/admin/AdminStoresScreen';
import { AdminRedemptionsScreen } from './components/admin/AdminRedemptionsScreen';
import { AdminRewardsScreen } from './components/admin/AdminRewardsScreen';
import { AdminCategoriesScreen } from './components/admin/AdminCategoriesScreen';
import { AdminOrdersScreen } from './components/admin/orders/AdminOrdersScreen';
import { AdminLogsScreen } from './components/admin/AdminLogsScreen';
import { AdminSettingsScreen } from './components/admin/AdminSettingsScreen';
import { ProfessionalProfileScreen } from './components/auth/ProfessionalProfileScreen';
import { ServicesScreen } from './components/services/ServicesScreen';
import { AdminCouponsScreen } from './components/admin/coupons/AdminCouponsScreen';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/profile/address",
    element: <AddressList />,
  },
  {
    path: "/profile/address/add",
    element: <AddAddress />,
  },
  {
    path: "/profile/address/:id",
    element: <EditAddress />,
  },
  {
    path: "/profile/orders",
    element: <OrdersScreen />,
  },
   {
    path: "/profile/orders/:id",
    element: <OrderDetailsScreen />,
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
