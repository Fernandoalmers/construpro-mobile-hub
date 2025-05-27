
import React from 'react';
import { AdminLayout } from '../AdminLayout';
import { ProductsTable } from './ProductsTable';
import { ProductsHeader } from './ProductsHeader';
import { useAdminProducts } from '@/hooks/useAdminProducts';

const AdminProductsScreen: React.FC = () => {
  const {
    products,
    loading,
    error,
    filters,
    updateFilters,
    refreshProducts
  } = useAdminProducts();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <ProductsHeader />
        <ProductsTable 
          products={products}
          loading={loading}
          error={error}
          filters={filters}
          onFiltersChange={updateFilters}
          onRefresh={refreshProducts}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProductsScreen;
