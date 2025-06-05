
import React, { useState, useEffect } from 'react';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import SearchAndFilterSection from './components/SearchAndFilterSection';
import MarketplaceContent from './components/MarketplaceContent';
import { useMarketplaceParams } from './hooks/useMarketplaceParams';
import { useMarketplaceSegments } from './hooks/useMarketplaceSegments';
import { useMarketplaceSearch } from './hooks/useMarketplaceSearch';

const MarketplaceScreen: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  
  // Custom hooks for managing different aspects
  const {
    categoryParam,
    initialCategories,
    selectedSegmentId,
    setSelectedSegmentId,
    selectedSegments,
    setSelectedSegments,
    updateSegmentURL
  } = useMarketplaceParams();
  
  const { segmentOptions } = useMarketplaceSegments();
  const { term, setTerm, handleSubmit, fetchProducts } = useMarketplaceSearch();
  
  // Use our custom hooks
  const { hideHeader } = useScrollBehavior();
  const { products, stores, isLoading, storesError } = useMarketplaceData(selectedSegmentId);
  
  // Extract all categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(products.map(product => product.categoria));
    return Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, [products]);
  
  // Enhanced product filter with optimized pagination
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
    handleSearchChange,
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    handlePriceRangeClick,
    loadMoreProducts,
    clearFilters: originalClearFilters,
    setSelectedLojas,
    setPage
  } = useProductFilter({ 
    initialCategories, 
    initialProducts: products,
    initialSearch: term || '' 
  });

  // Debug info logging
  useEffect(() => {
    // Log products availability for debugging
    console.log('[MarketplaceScreen] Products loaded for ALL users:', products.length);
    
    // If no products are showing, add additional debugging
    if (products.length === 0 && !isLoading) {
      console.warn('[MarketplaceScreen] NO PRODUCTS FOUND! This could indicate:');
      console.warn('1. No approved products in database');
      console.warn('2. Segment filter is too restrictive');
      console.warn('3. Database connection issue');
      console.warn('4. RLS policy blocking access');
    }
  }, [products.length, isLoading]);

  // Modified clearFilters function that preserves segment selection
  const clearFilters = () => {
    originalClearFilters();
    console.log('[MarketplaceScreen] Clearing filters but preserving segment:', selectedSegmentId);
    
    if (selectedSegmentId && selectedSegmentId !== "all") {
      updateSegmentURL(selectedSegmentId);
    }
    
    setPage(1);
  };
  
  // Segment filter handling
  const handleSegmentClick = (segmentId: string) => {
    console.log('[MarketplaceScreen] Segment clicked:', segmentId);
    
    if (segmentId === "all") {
      setSelectedSegmentId(null);
      setSelectedSegments([]);
      updateSegmentURL(null);
      return;
    }
    
    setSelectedSegments([segmentId]);
    setSelectedSegmentId(segmentId);
    updateSegmentURL(segmentId);
    setPage(1);
  };

  // Re-enabled loja click functionality with improved logging
  const handleLojaCardClick = (lojaId: string) => {
    console.log('[MarketplaceScreen] Store card clicked:', lojaId);
    console.log('[MarketplaceScreen] Current selected lojas:', selectedLojas);
    
    // Re-enable store filtering
    setSelectedLojas([lojaId]);
    setPage(1);
    
    console.log('[MarketplaceScreen] Store filter applied for:', lojaId);
  };

  // Current category name for display
  const getCurrentDisplayName = () => {
    if (selectedSegmentId) {
      const segmentName = segmentOptions.find(s => s.id === selectedSegmentId)?.label;
      if (segmentName) return segmentName;
    }
    
    if (selectedCategories.length === 1) {
      return categories.find(cat => cat.id === selectedCategories[0])?.label;
    }
    
    return "Todos os Produtos";
  };

  const currentCategoryName = getCurrentDisplayName();

  // Calculate dynamic padding based on header visibility and height - FIXED LOGIC
  const dynamicPaddingTop = hideHeader ? 0 : headerHeight;

  // Handle header height changes
  const handleHeaderHeightChange = (height: number) => {
    setHeaderHeight(height);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Search and Filter Header */}
      <SearchAndFilterSection
        hideHeader={hideHeader}
        searchTerm={term}
        setSearchTerm={setTerm}
        selectedCategories={selectedCategories}
        selectedLojas={selectedLojas}
        selectedRatings={selectedRatings}
        selectedSegments={selectedSegments}
        selectedPriceRanges={selectedPriceRanges}
        allCategories={categories}
        ratingOptions={ratingOptions}
        priceRangeOptions={priceRangeOptions}
        segmentOptions={segmentOptions}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
        onPriceRangeClick={handlePriceRangeClick}
        onSegmentClick={handleSegmentClick}
        onSearch={handleSubmit}
        clearFilters={clearFilters}
        stores={stores}
        handleSearchChange={(term) => setTerm(term)}
        onHeightChange={handleHeaderHeightChange}
      />
      
      {/* Main Content */}
      <MarketplaceContent
        dynamicPaddingTop={dynamicPaddingTop}
        selectedSegmentId={selectedSegmentId}
        onSegmentClick={handleSegmentClick}
        stores={stores}
        onLojaClick={handleLojaCardClick}
        storesError={storesError}
        currentCategoryName={currentCategoryName}
        filteredProdutos={filteredProdutos}
        isLoading={isLoading}
        displayedProducts={displayedProducts}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadMoreProducts={loadMoreProducts}
        clearFilters={clearFilters}
      />
    </div>
  );
};

export default MarketplaceScreen;
