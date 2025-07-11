
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedProductCard from './components/OptimizedProductCard';
import OptimizedSkeleton from '../common/OptimizedSkeleton';
import EmptyProductState from './components/EmptyProductState';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import LoadingIndicator from './components/LoadingIndicator';

interface ProductListSectionProps {
  displayedProducts: any[];
  filteredProdutos: any[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
  onLojaClick: (lojaId: string) => void;
  isLoading: boolean;
  viewType?: 'list' | 'grid';
  showActions?: boolean;
}

const ProductListSection = memo<ProductListSectionProps>(({
  displayedProducts,
  filteredProdutos,
  hasMore,
  isLoadingMore,
  loadMoreProducts,
  clearFilters,
  isLoading,
  viewType = 'grid'
}) => {
  const navigate = useNavigate();

  const { observerRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMoreProducts,
    threshold: 200
  });

  const handleProductClick = useCallback((productId: string) => {
    if (productId) {
      navigate(`/produto/${productId}`);
    }
  }, [navigate]);

  // Ensure arrays are safe to use
  const safeDisplayedProducts = Array.isArray(displayedProducts) ? displayedProducts : [];
  const safeFilteredProducts = Array.isArray(filteredProdutos) ? filteredProdutos : [];

  console.log('[ProductListSection] Rendering with:', {
    displayedCount: safeDisplayedProducts.length,
    filteredCount: safeFilteredProducts.length,
    isLoading,
    hasMore,
    isLoadingMore
  });

  // Show skeleton loading while initial load
  if (isLoading) {
    return <OptimizedSkeleton rows={6} className="px-4" />;
  }

  // Show empty state if no products
  if (safeFilteredProducts.length === 0) {
    return <EmptyProductState clearFilters={clearFilters} />;
  }

  return (
    <div className="space-y-4">
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
        {safeDisplayedProducts.map((product) => (
          <OptimizedProductCard
            key={product?.id || Math.random()}
            product={product}
            onClick={handleProductClick}
          />
        ))}
      </div>

      {/* Infinite Scroll Observer */}
      {hasMore && safeDisplayedProducts.length > 0 && (
        <LoadingIndicator
          loadMoreRef={observerRef}
          isVisible={isLoadingMore}
          text="Carregando mais produtos..."
        />
      )}
    </div>
  );
});

ProductListSection.displayName = 'ProductListSection';

export default ProductListSection;
