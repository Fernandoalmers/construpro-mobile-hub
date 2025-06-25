
import React from 'react';
import ProdutoCard from '../ProdutoCard';
import { useNavigate } from 'react-router-dom';

interface GridProductViewProps {
  products: any[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMore?: () => void;
  onLojaClick?: (lojaId: string) => void;
  showActions?: boolean;
}

const GridProductView: React.FC<GridProductViewProps> = ({ 
  products, 
  hasMore,
  isLoadingMore,
  loadMore,
  onLojaClick,
}) => {
  const navigate = useNavigate();

  const navigateToProduct = (productId: string) => {
    navigate(`/produto/${productId}`);
  };

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
