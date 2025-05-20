
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VendorModeScreen from './VendorModeScreen';
import VendorOrdersScreen from './VendorOrdersScreen';
import EnhancedCustomersScreen from './EnhancedCustomersScreen';
import CustomerDetailScreen from './CustomerDetailScreen';
import AjustePontosVendorScreen from './AjustePontosVendorScreen';
import ConfiguracoesVendorScreen from './ConfiguracoesVendorScreen';
import VendorOrderDetailScreen from './VendorOrderDetailScreen';
import ProductManagementScreen from './ProductManagementScreen';
import ProdutoFormScreen from './ProdutoFormScreen';
import ProdutoEditScreen from './ProdutoEditScreen';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const VendorRoutes: React.FC = () => {
  const { profile } = useAuth();
  const isVendor = profile?.papel === 'lojista' || profile?.tipo_perfil === 'lojista';
  
  // Redirect to profile if not a vendor
  if (!isVendor) {
    return <Navigate to="/profile" replace />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<VendorModeScreen />} />
      <Route path="/orders" element={<VendorOrdersScreen />} />
      <Route path="/orders/:id" element={<VendorOrderDetailScreen />} />
      <Route path="/customers" element={<EnhancedCustomersScreen />} />
      <Route path="/customers/:id" element={<CustomerDetailScreen />} />
      <Route path="/points-adjustment" element={<AjustePontosVendorScreen />} />
      <Route path="/ajuste-pontos" element={<AjustePontosVendorScreen />} /> 
      <Route path="points-adjustment" element={<AjustePontosVendorScreen />} /> {/* Added without leading slash */}
      <Route path="ajuste-pontos" element={<AjustePontosVendorScreen />} /> {/* Added without leading slash */}
      <Route path="/settings" element={<ConfiguracoesVendorScreen />} />
      <Route path="/products" element={<ProductManagementScreen />} />
      <Route path="/produtos" element={<ProductManagementScreen />} /> 
      <Route path="/products/new" element={<ProdutoFormScreen />} />
      <Route path="/products/edit/:id" element={<ProdutoEditScreen />} />
    </Routes>
  );
};

export default VendorRoutes;
