
import React from 'react';
import ProdutoCard from '../ProdutoCard';
import { useNavigate } from 'react-router-dom';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import LoadingIndicator from './LoadingIndicator';

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
  hasMore = false,
  isLoadingMore = false,
  loadMore = () => {},
  onLojaClick,
}) => {
  const navigate = useNavigate();

  const { observerRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
    threshold: 200
  });

  const navigateToProduct = (productId: string) => {
    navigate(`/produto/${productId}`);
  };

  console.log('[GridProductView] Rendering with:', {
    productsCount: products.length,
    hasMore,
    isLoadingMore,
    loadMoreFunction: typeof loadMore
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {products.map(produto => (
          <ProdutoCard
            key={produto.id}
            produto={produto}
            onClick={() => navigateToProduct(produto.id)}
          />
        ))}
      </div>
      
      {/* Observer element for infinite scroll */}
      {hasMore && (
        <LoadingIndicator
          loadMoreRef={observerRef}
          isVisible={isLoadingMore}
          text="Carregando mais produtos..."
        />
      )}
    </div>
  );
};

export default GridProductView;
