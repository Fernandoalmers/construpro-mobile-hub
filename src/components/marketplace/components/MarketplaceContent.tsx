
import React from 'react';
import CategoryHeader from './CategoryHeader';
import StoresSection from './StoresSection';
import SegmentCardsHeader from './SegmentCardsHeader';
import ProductListSection from '../ProductListSection';
import LoadingState from '../../common/LoadingState';

interface MarketplaceContentProps {
  dynamicPaddingTop: number;
  selectedSegmentId: string | null;
  onSegmentClick: (segmentId: string) => void;
  stores: any[];
  onLojaClick: (lojaId: string) => void;
  storesError: string | null;
  currentCategoryName: string;
  filteredProdutos: any[];
  isLoading: boolean;
  displayedProducts: any[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreProducts: () => void;
  clearFilters: () => void;
}

const MarketplaceContent: React.FC<MarketplaceContentProps> = ({
  dynamicPaddingTop,
  selectedSegmentId,
  onSegmentClick,
  stores,
  onLojaClick,
  storesError,
  currentCategoryName,
  filteredProdutos,
  isLoading,
  displayedProducts,
  hasMore,
  isLoadingMore,
  loadMoreProducts,
  clearFilters
}) => {
  return (
    <div 
      className="transition-all duration-300 ease-out"
      style={{ 
        paddingTop: `${dynamicPaddingTop}px`
      }}
    >
      {/* Segment Cards Header */}
      <SegmentCardsHeader 
        selectedSegment={selectedSegmentId}
        onSegmentClick={onSegmentClick}
      />
      
      {/* Stores Section */}
      <StoresSection 
        stores={stores}
        onLojaClick={onLojaClick}
        storesError={storesError}
      />
      
      {/* Category Header */}
      <CategoryHeader 
        currentCategoryName={currentCategoryName || "Todos os Produtos"}
        productCount={filteredProdutos.length}
      />
      
      {/* Product List */}
      <div className="px-2 py-2 flex-1">
        {isLoading ? (
          <LoadingState type="spinner" text="Carregando produtos..." count={3} />
        ) : (
          <ProductListSection 
            displayedProducts={displayedProducts}
            filteredProdutos={filteredProdutos}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreProducts={loadMoreProducts}
            clearFilters={clearFilters}
            onLojaClick={onLojaClick}
            isLoading={isLoading}
            viewType="list"
            showActions={true}
          />
        )}
      </div>
    </div>
  );
};

export default MarketplaceContent;
