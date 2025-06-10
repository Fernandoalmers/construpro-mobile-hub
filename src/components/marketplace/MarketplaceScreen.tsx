import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import { useOptimizedMarketplace } from '@/hooks/useOptimizedMarketplace';
import MarketplaceHeader from './MarketplaceHeader';
import MarketplaceContent from './components/MarketplaceContent';
import { useMarketplaceParams } from './hooks/useMarketplaceParams';
import { useMarketplaceSegments } from './hooks/useMarketplaceSegments';
import { useMarketplaceSearch } from './hooks/useMarketplaceSearch';
import LoadingState from '../common/LoadingState';

const MarketplaceScreen: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  // Use optimized marketplace data hook with safety checks
  const { products, stores, segments, isLoading, error } = useOptimizedMarketplace();
  
  // Ensure data safety with default values
  const safeProducts = Array.isArray(products) ? products : [];
  const safeStores = Array.isArray(stores) ? stores : [];
  
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
  
  // Filter products by selected segment with safety checks
  const segmentFilteredProducts = React.useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[MarketplaceScreen] No segment filter - returning all products:', safeProducts.length);
      return safeProducts;
    }
    
    const filtered = safeProducts.filter(product => 
      product?.segmento_id === selectedSegmentId
    );
    
    console.log('[MarketplaceScreen] Segment filtered products:', filtered.length, 'from', safeProducts.length);
    return filtered;
  }, [safeProducts, selectedSegmentId]);
  
  // Extract all categories from products with safety checks
  const categories = React.useMemo(() => {
    if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
      return [];
    }
    
    const uniqueCategories = new Set(
      safeProducts
        .filter(product => product?.categoria)
        .map(product => product.categoria)
    );
    
    return Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, [safeProducts]);
  
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
    initialProducts: segmentFilteredProducts,
    initialSearch: term || '' 
  });

  // Sync search term between useMarketplaceSearch and useProductFilter
  useEffect(() => {
    console.log('[MarketplaceScreen] Syncing search term:', term);
    if (handleSearchChange) {
      handleSearchChange(term || '');
    }
  }, [term, handleSearchChange]);

  // Debounce effect for automatic search and reset
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((term || '').trim().length >= 2) {
        console.log('[MarketplaceScreen] Auto-searching for:', term);
        handleSubmit();
      } else if ((term || '').trim().length === 0) {
        console.log('[MarketplaceScreen] Search cleared, showing all products');
        handleSubmit();
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

  // Debug info logging with safety checks
  useEffect(() => {
    console.log('[MarketplaceScreen] Products loaded for ALL users:', safeProducts.length);
    
    if (safeProducts.length === 0 && !isLoading) {
      console.warn('[MarketplaceScreen] NO PRODUCTS FOUND! This could indicate:');
      console.warn('1. No approved products in database');
      console.warn('2. Segment filter is too restrictive');
      console.warn('3. Database connection issue');
      console.warn('4. RLS policy blocking access');
    }
  }, [safeProducts.length, isLoading]);

  // Modified clearFilters function that preserves segment selection
  const clearFilters = () => {
    if (originalClearFilters) {
      originalClearFilters();
    }
    console.log('[MarketplaceScreen] Clearing filters but preserving segment:', selectedSegmentId);
    
    if (selectedSegmentId && selectedSegmentId !== "all") {
      updateSegmentURL(selectedSegmentId);
    }
    
    if (setPage) {
      setPage(1);
    }
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
    if (setPage) {
      setPage(1);
    }
  };

  // Re-enabled loja click functionality with improved logging
  const handleLojaCardClick = (lojaId: string) => {
    console.log('[MarketplaceScreen] Store card clicked:', lojaId);
    console.log('[MarketplaceScreen] Current selected lojas:', selectedLojas);
    
    if (setSelectedLojas) {
      setSelectedLojas([lojaId]);
    }
    if (setPage) {
      setPage(1);
    }
    
    console.log('[MarketplaceScreen] Store filter applied for:', lojaId);
  };

  // Current category name for display
  const getCurrentDisplayName = () => {
    if (selectedSegmentId && Array.isArray(segmentOptions)) {
      const segmentName = segmentOptions.find(s => s?.id === selectedSegmentId)?.label;
      if (segmentName) return segmentName;
    }
    
    if (Array.isArray(selectedCategories) && selectedCategories.length === 1 && Array.isArray(categories)) {
      const categoryName = categories.find(cat => cat?.id === selectedCategories[0])?.label;
      if (categoryName) return categoryName;
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
      {/* Fixed Header - completely outside layout flow */}
      <MarketplaceHeader 
        hideHeader={hideHeader}
        searchTerm={term || ''}
        selectedCategories={Array.isArray(selectedCategories) ? selectedCategories : []}
        selectedLojas={Array.isArray(selectedLojas) ? selectedLojas : []}
        selectedRatings={Array.isArray(selectedRatings) ? selectedRatings : []}
        selectedSegments={Array.isArray(selectedSegments) ? selectedSegments : []}
        selectedPriceRanges={Array.isArray(selectedPriceRanges) ? selectedPriceRanges : []}
        selectedSegmentId={selectedSegmentId}
        allCategories={Array.isArray(categories) ? categories : []}
        ratingOptions={Array.isArray(ratingOptions) ? ratingOptions : []}
        priceRangeOptions={Array.isArray(priceRangeOptions) ? priceRangeOptions : []}
        segmentOptions={Array.isArray(segmentOptions) ? segmentOptions : []}
        viewType={viewType}
        setViewType={setViewType}
        onSearchChange={handleSearchInputChange}
        onSearch={handleExplicitSearch}
        onLojaClick={handleLojaClick || (() => {})}
        onCategoryClick={handleCategoryClick || (() => {})}
        onRatingClick={handleRatingClick || (() => {})}
        onSegmentClick={handleSegmentClick}
        onPriceRangeClick={handlePriceRangeClick || (() => {})}
        clearFilters={clearFilters}
        stores={safeStores}
        onHeightChange={handleHeaderHeightChange}
      />
      
      {/* Main Content with dynamic padding */}
      <MarketplaceContent
        dynamicPaddingTop={dynamicPaddingTop}
        stores={safeStores}
        onLojaClick={handleLojaCardClick}
        storesError={null}
        currentCategoryName={currentCategoryName}
        filteredProdutos={Array.isArray(filteredProdutos) ? filteredProdutos : []}
        isLoading={isLoading}
        displayedProducts={Array.isArray(displayedProducts) ? displayedProducts : []}
        hasMore={hasMore || false}
        isLoadingMore={isLoadingMore || false}
        loadMoreProducts={loadMoreProducts || (() => {})}
        clearFilters={clearFilters}
        viewType={viewType}
        setViewType={setViewType}
      />
    </div>
  );
};

export default MarketplaceScreen;
