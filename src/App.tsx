import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Vendor Pages
import ProductsListPage from "./pages/vendor/ProductsListPage";
import ProductFormPage from "./pages/vendor/ProductFormPage";

// Shop Pages
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";

// Home and Profile
import HomeScreenWrapper from "./components/home/HomeScreenWrapper";
import ProfileScreen from "./components/profile/ProfileScreen";
import CartScreen from "./components/marketplace/CartScreen";

// Other components
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main user routes with bottom navigation */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<MainLayout><HomeScreenWrapper /></MainLayout>} />
        <Route path="/shop" element={<MainLayout><ShopPage /></MainLayout>} />
        <Route path="/shop/product/:id" element={<MainLayout><ProductDetailPage /></MainLayout>} />
        <Route path="/profile" element={<MainLayout><ProfileScreen /></MainLayout>} />
        <Route path="/cart" element={<MainLayout><CartScreen /></MainLayout>} />
        <Route path="/marketplace" element={<Navigate to="/shop" replace />} />
        
        {/* Vendor Product Routes */}
        <Route path="/vendor/products" element={<Navigate to="/vendor/products/list" replace />} />
        <Route path="/vendor/products/list" element={<ProductsListPage />} />
        <Route path="/vendor/products/new" element={<ProductFormPage />} />
        <Route path="/vendor/products/edit/:id" element={<ProductFormPage />} />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
