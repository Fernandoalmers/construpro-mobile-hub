
import React from 'react';
import ProdutoCard from '../ProdutoCard';

interface GridProductViewProps {
  products: any[];
  navigateToProduct: (productId: string) => void;
  onLojaClick?: (lojaId: string) => void;
  showActions?: boolean;
}

const GridProductView: React.FC<GridProductViewProps> = ({ 
  products, 
  navigateToProduct, 
  onLojaClick,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map(produto => (
        <ProdutoCard
          key={produto.id}
          produto={produto}
          onClick={() => navigateToProduct(produto.id)}
        />
      ))}
    </div>
  );
};

export default GridProductView;
