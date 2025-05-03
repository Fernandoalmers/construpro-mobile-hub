import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Vendor Pages
import ProductsListPage from "./pages/vendor/ProductsListPage";
import ProductFormPage from "./pages/vendor/ProductFormPage";

// Shop Pages
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";

// Import other existing components and pages as needed

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}

        {/* Vendor Product Routes */}
        <Route path="/vendor/products" element={<Navigate to="/vendor/products/list" replace />} />
        <Route path="/vendor/products/list" element={<ProductsListPage />} />
        <Route path="/vendor/products/new" element={<ProductFormPage />} />
        <Route path="/vendor/products/edit/:id" element={<ProductFormPage />} />

        {/* Shop Routes */}
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/product/:id" element={<ProductDetailPage />} />

        {/* Add other routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
