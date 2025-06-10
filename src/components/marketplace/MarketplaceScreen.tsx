
import React, { useEffect } from 'react';
import { useMarketplaceState } from './hooks/useMarketplaceState';
import { useMarketplaceFilters } from './components/MarketplaceFilters';
import { MarketplaceDisplay } from './components/MarketplaceDisplay';
import { getCurrentDisplayName, logDebugInfo } from './utils/marketplaceUtils';
import LoadingState from '../common/LoadingState';

const MarketplaceScreen: React.FC = () => {
  // Get all marketplace state from custom hook
  const {
    headerHeight,
    setHeaderHeight,
    viewType,
    setViewType,
    location,
    navigate,
    safeProducts,
    safeStores,
    isLoading,
    error,
    categoryParam,
    initialCategories,
    selectedSegmentId,
    setSelectedSegmentId,
    selectedSegments,
    setSelectedSegments,
    updateSegmentURL,
    segmentOptions,
    term,
    setTerm,
    handleSubmit,
    segmentFilteredProducts,
    categories
  } = useMarketplaceState();

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[MarketplaceScreen] Input change event:', e.target.value);
    setTerm(e.target.value || '');
  };

  // Explicit search functionality
  const handleExplicitSearch = () => {
    console.log('[MarketplaceScreen] Explicit search with term:', term);
    if ((term || '').trim().length >= 2) {
      handleSubmit();
    } else if ((term || '').trim().length === 0) {
      handleSubmit();
    }
  };

  // Get marketplace filters and handlers
  const {
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    ratingOptions,
    priceRangeOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    isLoadingMore,
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    handlePriceRangeClick,
    loadMoreProducts,
    clearFilters,
    handleSegmentClick,
    handleLojaCardClick
  } = useMarketplaceFilters({
    initialCategories,
    segmentFilteredProducts,
    term,
    selectedSegmentId,
    setSelectedSegmentId,
    selectedSegments,
    setSelectedSegments,
    updateSegmentURL,
    handleSearchChange: handleSearchInputChange,
    handleSubmit,
    location,
    navigate
  });

  // Current category name for display
  const currentCategoryName = getCurrentDisplayName(
    selectedSegmentId,
    segmentOptions,
    selectedCategories,
    categories
  );

  // Debug info logging with safety checks
  useEffect(() => {
    logDebugInfo(safeProducts, isLoading);
  }, [safeProducts.length, isLoading]);

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
    <MarketplaceDisplay
      headerHeight={headerHeight}
      setHeaderHeight={setHeaderHeight}
      viewType={viewType}
      setViewType={setViewType}
      term={term}
      selectedCategories={selectedCategories}
      selectedLojas={selectedLojas}
      selectedRatings={selectedRatings}
      selectedSegments={selectedSegments}
      selectedPriceRanges={selectedPriceRanges}
      selectedSegmentId={selectedSegmentId}
      categories={categories}
      ratingOptions={ratingOptions}
      priceRangeOptions={priceRangeOptions}
      segmentOptions={segmentOptions}
      safeStores={safeStores}
      handleSearchInputChange={handleSearchInputChange}
      handleExplicitSearch={handleExplicitSearch}
      handleLojaClick={handleLojaClick}
      handleCategoryClick={handleCategoryClick}
      handleRatingClick={handleRatingClick}
      handleSegmentClick={handleSegmentClick}
      handlePriceRangeClick={handlePriceRangeClick}
      clearFilters={clearFilters}
      handleLojaCardClick={handleLojaCardClick}
      currentCategoryName={currentCategoryName}
      filteredProdutos={filteredProdutos}
      isLoading={isLoading}
      displayedProducts={displayedProducts}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      loadMoreProducts={loadMoreProducts}
    />
  );
};

export default MarketplaceScreen;
