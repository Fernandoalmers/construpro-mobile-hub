
import React from 'react';
import ShopProductsList from '@/components/shop/ShopProductsList';

const ShopPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Loja</h1>
      <ShopProductsList />
    </div>
  );
};

export default ShopPage;
