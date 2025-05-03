
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProductsHeaderProps {
  productCount: number;
  debugData: () => Promise<void>;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ productCount, debugData }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {productCount} {productCount === 1 ? 'produto' : 'produtos'} encontrados
        </span>
        <Button variant="ghost" size="sm" onClick={debugData} title="Debug data">
          🐞
        </Button>
      </div>
    </div>
  );
};

export default ProductsHeader;
