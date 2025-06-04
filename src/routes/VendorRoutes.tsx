
import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute, VendorOrdersScreen } from '../imports';
import {
  VendorModeScreen,
  ProductManagementScreen,
  ProdutoFormScreen,
  ProdutoEditScreen,
  ClientesVendorScreen,
  ConfiguracoesVendorScreen,
  AjustePontosVendorScreen,
  VendorOrderDetailScreen
} from './RouteImports';

const VendorRoutes: React.FC = () => {
  return (
    <>
      <Route path="/vendor" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
      <Route path="/vendor/products" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
      <Route path="/vendor/products/new" element={<ProtectedRoute><ProdutoFormScreen /></ProtectedRoute>} />
      <Route path="/vendor/product-new" element={<ProtectedRoute><ProdutoFormScreen /></ProtectedRoute>} />
      
      {/* Product edit routes */}
      <Route path="/vendor/product-edit/:id" element={<ProtectedRoute><ProdutoEditScreen /></ProtectedRoute>} />
      <Route path="/vendor/products/edit/:id" element={<ProtectedRoute><ProdutoEditScreen /></ProtectedRoute>} />
      
      <Route path="/vendor/orders" element={<ProtectedRoute><VendorOrdersScreen /></ProtectedRoute>} />
      <Route path="/vendor/orders/:id" element={<ProtectedRoute><VendorOrderDetailScreen /></ProtectedRoute>} />
      <Route path="/vendor/customers" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />
      <Route path="/vendor/adjust-points" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />
      <Route path="/vendor/settings" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
      <Route path="/vendor/store-config" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
      
      {/* Portuguese aliases */}
      <Route path="/vendor/produtos" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />
      <Route path="/vendor/clientes" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />
      <Route path="/vendor/ajuste-pontos" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />
      <Route path="/vendor/configuracoes" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />
      
      {/* Legacy vendor routes */}
      <Route path="/vendor-dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
      <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
    </>
  );
};

export default VendorRoutes;
