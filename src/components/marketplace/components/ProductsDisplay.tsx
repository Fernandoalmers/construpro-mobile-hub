
import React from 'react';
import GridProductView from './GridProductView';
import ListProductView from './ListProductView';

interface ProductsDisplayProps {
  viewType: 'grid' | 'list';
  products: any[];
  displayedProducts: any[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreProducts: () => void;
  onLojaClick?: (lojaId: string) => void;
}

const ProductsDisplay: React.FC<ProductsDisplayProps> = ({
  viewType,
  products,
  displayedProducts,
  hasMore,
  isLoadingMore,
  loadMoreProducts,
  onLojaClick
}) => {
  console.log('[ProductsDisplay] Rendering with:', {
    viewType,
    totalProducts: products.length,
    displayedProducts: displayedProducts.length,
    hasMore,
    isLoadingMore
  });

  if (products.length === 0) {
    return null;
  }

  return (
    <>
      {viewType === 'grid' ? (
        <GridProductView
          products={displayedProducts}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadMore={loadMoreProducts}
          onLojaClick={onLojaClick}
        />
      ) : (
        <ListProductView
          products={displayedProducts}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadMore={loadMoreProducts}
          onLojaClick={onLojaClick}
        />
      )}
    </>
  );
};

export default ProductsDisplay;
