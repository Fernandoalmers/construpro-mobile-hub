
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useProductManagement } from '@/hooks/vendor/useProductManagement';
import ProductHeader from './ProductHeader';
import ProductFilters from '../ProductFilters';
import ProductList from '../ProductList';
import EmptyProductState from './EmptyProductState';
import LoadingState from '../../common/LoadingState';

const ProductManagementContainer: React.FC = () => {
  const navigate = useNavigate();
  const { 
    products,
    filteredProducts,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    handleToggleStatus,
    handleDelete,
    handleClearFilters,
    refetch
  } = useProductManagement();
  
  const handleNewProduct = () => {
    navigate('/vendor/products/new');
  };
  
  const handleEdit = (id: string) => {
    console.log(`Redirecting to edit product with ID: ${id}`);
    navigate(`/vendor/products/edit/${id}`);
  };
  
  if (error) {
    toast.error('Error loading products');
    console.error('Error fetching products:', error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      <ProductHeader onNewProduct={handleNewProduct} />
      
      <div className="p-6 space-y-4">
        <ProductFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
        
        {isLoading ? (
          <LoadingState text="Loading products..." />
        ) : filteredProducts.length === 0 ? (
          <EmptyProductState
            onNewProduct={handleNewProduct}
            onClearFilters={handleClearFilters}
            onRefresh={() => refetch()}
            hasProducts={products.length > 0}
          />
        ) : (
          <ProductList
            products={filteredProducts}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>
    </div>
  );
};

export default ProductManagementContainer;
