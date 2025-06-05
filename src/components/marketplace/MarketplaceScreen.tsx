
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import MarketplaceHeader from './MarketplaceHeader';
import MarketplaceContent from './components/MarketplaceContent';
import { useMarketplaceParams } from './hooks/useMarketplaceParams';
import { useMarketplaceSegments } from './hooks/useMarketplaceSegments';
import { useMarketplaceSearch } from './hooks/useMarketplaceSearch';

const MarketplaceScreen: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
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

  // Debounce effect for automatic search and reset
  useEffect(() => {
    const timer = setTimeout(() => {
      if (term.trim().length >= 2) {
        console.log('[MarketplaceScreen] Auto-searching for:', term);
        handleSubmit(term);
      } else if (term.trim().length === 0) {
        console.log('[MarketplaceScreen] Search cleared, showing all products');
        handleSubmit('');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [term, handleSubmit]);

  // Update URL when search term changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (term && term.trim().length >= 2) {
      newSearchParams.set('search', term);
    } else {
      newSearchParams.delete('search');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  }, [term, location.pathname, navigate]);

  // Debug info logging
  useEffect(() => {
    console.log('[MarketplaceScreen] Products loaded for ALL users:', products.length);
    
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

  // Calculate dynamic padding based on header visibility and height
  const dynamicPaddingTop = hideHeader ? 0 : headerHeight;

  // Handle header height changes
  const handleHeaderHeightChange = (height: number) => {
    setHeaderHeight(height);
  };

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[MarketplaceScreen] Input change event:', e.target.value);
    setTerm(e.target.value);
  };

  // Explicit search functionality
  const handleExplicitSearch = () => {
    console.log('[MarketplaceScreen] Explicit search with term:', term);
    if (term.trim().length >= 2) {
      handleSubmit(term);
    } else if (term.trim().length === 0) {
      handleSubmit('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header - completely outside layout flow */}
      <MarketplaceHeader 
        hideHeader={hideHeader}
        searchTerm={term}
        selectedCategories={selectedCategories}
        selectedLojas={selectedLojas}
        selectedRatings={selectedRatings}
        selectedSegments={selectedSegments}
        selectedPriceRanges={selectedPriceRanges}
        selectedSegmentId={selectedSegmentId}
        allCategories={categories}
        ratingOptions={ratingOptions}
        priceRangeOptions={priceRangeOptions}
        segmentOptions={segmentOptions}
        onSearchChange={handleSearchInputChange}
        onSearch={handleExplicitSearch}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
        onSegmentClick={handleSegmentClick}
        onPriceRangeClick={handlePriceRangeClick}
        clearFilters={clearFilters}
        stores={stores}
        onHeightChange={handleHeaderHeightChange}
      />
      
      {/* Main Content with dynamic padding */}
      <MarketplaceContent
        dynamicPaddingTop={dynamicPaddingTop}
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
