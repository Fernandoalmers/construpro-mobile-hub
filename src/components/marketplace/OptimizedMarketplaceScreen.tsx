
import React from 'react';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useMarketplaceScreenLogic } from './hooks/useMarketplaceScreenLogic';
import MarketplaceHeader from './MarketplaceHeader';
import MarketplaceContent from './components/MarketplaceContent';
import LoadingState from '../common/LoadingState';

const OptimizedMarketplaceScreen: React.FC = () => {
  const { hideHeader } = useScrollBehavior();
  useScrollPosition();
  
  const {
    // State
    headerHeight,
    setHeaderHeight,
    viewType,
    setViewType,
    
    // Data
    safeStores,
    isLoading,
    error,
    
    // Filter state
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    selectedSegmentId,
    selectedSegments,
    setSelectedSegmentId,
    
    // Filter options
    categories,
    ratingOptions,
    priceRangeOptions,
    segmentOptions,
    
    // Filtered results
    filteredProducts,
    displayedProducts,
    hasMore,
    isLoadingMore,
    actions,
    
    // Search
    term,
    handleSearchInputChange,
    handleSubmit,
    
    // Handlers
    handleSegmentClick,
    handleLojaCardClick,
    getCurrentDisplayName
  } = useMarketplaceScreenLogic();
  
  const currentCategoryName = getCurrentDisplayName();
  const dynamicPaddingTop = hideHeader ? 0 : headerHeight;
  
  // Show loading state
  if (isLoading) {
    return <LoadingState type="skeleton" text="Carregando marketplace..." count={6} />;
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar marketplace: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-construPro-blue text-white px-4 py-2 rounded"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <MarketplaceHeader 
        hideHeader={hideHeader}
        searchTerm={term || ''}
        selectedCategories={Array.isArray(selectedCategories) ? selectedCategories : []}
        selectedLojas={Array.isArray(selectedLojas) ? selectedLojas : []}
        selectedRatings={Array.isArray(selectedRatings) ? selectedRatings : []}
        selectedSegments={Array.isArray(selectedSegments) ? selectedSegments : []}
        selectedPriceRanges={Array.isArray(selectedPriceRanges) ? selectedPriceRanges : []}
        selectedSegmentId={selectedSegmentId}
        viewType={viewType}
        setViewType={setViewType}
        allCategories={Array.isArray(categories) ? categories : []}
        ratingOptions={ratingOptions}
        priceRangeOptions={priceRangeOptions}
        segmentOptions={Array.isArray(segmentOptions) ? segmentOptions : []}
        onSearchChange={handleSearchInputChange}
        onSearch={handleSubmit}
        onLojaClick={actions?.toggleLoja || (() => {})}
        onCategoryClick={actions?.toggleCategory || (() => {})}
        onRatingClick={actions?.toggleRating || (() => {})}
        onSegmentClick={handleSegmentClick}
        onPriceRangeClick={actions?.togglePriceRange || (() => {})}
        clearFilters={actions?.clearFilters || (() => {})}
        stores={safeStores}
        onHeightChange={setHeaderHeight}
      />
      
      <MarketplaceContent
        dynamicPaddingTop={dynamicPaddingTop}
        currentCategoryName={currentCategoryName}
        filteredProdutos={Array.isArray(filteredProducts) ? filteredProducts : []}
        isLoading={isLoading}
        displayedProducts={Array.isArray(displayedProducts) ? displayedProducts : []}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadMoreProducts={actions?.loadMore || (() => {})}
        clearFilters={actions?.clearFilters || (() => {})}
        viewType={viewType}
        onLojaClick={handleLojaCardClick}
        setSelectedSegmentId={setSelectedSegmentId}
        updateSegmentURL={(segmentId: string | null) => {
          // Extract updateSegmentURL from hook logic
          if (segmentId === null) {
            // Clear segment selection
            setSelectedSegmentId(null);
            // Update URL to remove segment parameter
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.delete('categoria');
            const newUrl = `${window.location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
            window.history.replaceState({}, '', newUrl);
          }
        }}
      />
    </div>
  );
};

export default OptimizedMarketplaceScreen;
