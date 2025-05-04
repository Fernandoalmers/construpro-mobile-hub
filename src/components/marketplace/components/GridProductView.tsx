
import React from 'react';
import ProdutoCard from '../ProdutoCard';

interface GridProductViewProps {
  products: any[];
  navigateToProduct: (productId: string) => void;
  onLojaClick?: (lojaId: string) => void;
}

const GridProductView: React.FC<GridProductViewProps> = ({ 
  products, 
  navigateToProduct, 
  onLojaClick
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map(produto => (
        <ProdutoCard
          key={produto.id}
          produto={produto}
          loja={produto.stores}
          onClick={() => navigateToProduct(produto.id)}
          onLojaClick={onLojaClick}
          onAddToCart={undefined} 
          onAddToFavorites={undefined}
          isAddingToCart={false}
          isFavorite={false}
        />
      ))}
    </div>
  );
};

export default GridProductView;
