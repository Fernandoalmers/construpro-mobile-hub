
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
  showActions = false
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map(produto => (
        <ProdutoCard
          key={produto.id}
          produto={produto}
          onClick={() => navigateToProduct(produto.id)}
          onLojaClick={onLojaClick}
          onAddToCart={undefined} 
          onAddToFavorites={undefined}
          isAddingToCart={false}
          isFavorite={false}
          showActions={showActions}
        />
      ))}
    </div>
  );
}

export default GridProductView;
