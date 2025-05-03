
import React from 'react';
import VendorLayout from '@/layouts/VendorLayout';
import ProductsList from '@/components/vendor/ProductsList';

const ProductsListPage = () => {
  return (
    <VendorLayout>
      <div className="container mx-auto p-4 md:p-6">
        <ProductsList />
      </div>
    </VendorLayout>
  );
};

export default ProductsListPage;
