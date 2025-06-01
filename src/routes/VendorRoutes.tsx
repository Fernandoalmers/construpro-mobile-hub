
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
  return [
    <Route key="vendor" path="/vendor" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />,
    <Route key="vendor-products" path="/vendor/products" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />,
    <Route key="vendor-products-new" path="/vendor/products/new" element={<ProtectedRoute><ProdutoFormScreen /></ProtectedRoute>} />,
    <Route key="vendor-product-new" path="/vendor/product-new" element={<ProtectedRoute><ProdutoFormScreen /></ProtectedRoute>} />,
    
    // Product edit routes
    <Route key="vendor-product-edit" path="/vendor/product-edit/:id" element={<ProtectedRoute><ProdutoEditScreen /></ProtectedRoute>} />,
    <Route key="vendor-products-edit" path="/vendor/products/edit/:id" element={<ProtectedRoute><ProdutoEditScreen /></ProtectedRoute>} />,
    
    <Route key="vendor-orders" path="/vendor/orders" element={<ProtectedRoute><VendorOrdersScreen /></ProtectedRoute>} />,
    <Route key="vendor-orders-detail" path="/vendor/orders/:id" element={<ProtectedRoute><VendorOrderDetailScreen /></ProtectedRoute>} />,
    <Route key="vendor-customers" path="/vendor/customers" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />,
    <Route key="vendor-adjust-points" path="/vendor/adjust-points" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />,
    <Route key="vendor-store-config" path="/vendor/store-config" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />,
    
    // Portuguese aliases
    <Route key="vendor-produtos" path="/vendor/produtos" element={<ProtectedRoute><ProductManagementScreen /></ProtectedRoute>} />,
    <Route key="vendor-clientes" path="/vendor/clientes" element={<ProtectedRoute><ClientesVendorScreen /></ProtectedRoute>} />,
    <Route key="vendor-ajuste-pontos" path="/vendor/ajuste-pontos" element={<ProtectedRoute><AjustePontosVendorScreen /></ProtectedRoute>} />,
    <Route key="vendor-configuracoes" path="/vendor/configuracoes" element={<ProtectedRoute><ConfiguracoesVendorScreen /></ProtectedRoute>} />,
    
    // Legacy vendor routes
    <Route key="vendor-dashboard-legacy" path="/vendor-dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />,
    <Route key="vendor-dashboard" path="/vendor/dashboard" element={<ProtectedRoute><VendorModeScreen /></ProtectedRoute>} />
  ];
};

export default VendorRoutes;
