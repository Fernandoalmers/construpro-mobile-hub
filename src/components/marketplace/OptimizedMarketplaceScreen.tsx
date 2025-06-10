import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import { useOptimizedMarketplace } from '@/hooks/useOptimizedMarketplace';
import { useOptimizedProductFilter } from '@/hooks/useOptimizedProductFilter';
import MarketplaceHeader from './MarketplaceHeader';
import MarketplaceContent from './components/MarketplaceContent';
import { useMarketplaceParams } from './hooks/useMarketplaceParams';
import { useMarketplaceSegments } from './hooks/useMarketplaceSegments';
import { useMarketplaceSearch } from './hooks/useMarketplaceSearch';
import LoadingState from '../common/LoadingState';

const OptimizedMarketplaceScreen: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use optimized marketplace data hook
  const { products, stores, segments, isLoading, error } = useOptimizedMarketplace();
  
  // Ensure data safety with default values
  const safeProducts = useMemo(() => {
    console.log('[OptimizedMarketplaceScreen] Products received:', products?.length || 0);
    return Array.isArray(products) ? products : [];
  }, [products]);
  
  const safeStores = useMemo(() => {
    console.log('[OptimizedMarketplaceScreen] Stores received:', stores?.length || 0);
    return Array.isArray(stores) ? stores : [];
  }, [stores]);
  
  const safeSegments = useMemo(() => {
    console.log('[OptimizedMarketplaceScreen] Segments received:', segments?.length || 0);
    return Array.isArray(segments) ? segments : [];
  }, [segments]);
  
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
  const { term, setTerm, handleSubmit } = useMarketplaceSearch();
  
  // Use optimized scroll behavior
  const { hideHeader } = useScrollBehavior();
  
  // Filter products by selected segment with safety checks
  const segmentFilteredProducts = useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[OptimizedMarketplaceScreen] No segment filter - returning all products:', safeProducts.length);
      return safeProducts;
    }
    
    const filtered = safeProducts.filter(product => 
      product?.segmento_id === selectedSegmentId
    );
    
    console.log('[OptimizedMarketplaceScreen] Segment filtered products:', filtered.length, 'from', safeProducts.length);
    return filtered;
  }, [safeProducts, selectedSegmentId]);
  
  // Use optimized product filter with safety checks
  const {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    filteredProducts,
    displayedProducts,
    hasMore,
    isLoadingMore,
    actions
  } = useOptimizedProductFilter(segmentFilteredProducts);
  
  // Extract categories from products with safety checks
  const categories = useMemo(() => {
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
  
  // Sync search term with safety check
  useEffect(() => {
    if (actions?.setSearchTerm) {
      actions.setSearchTerm(term || '');
    }
  }, [term, actions]);
  
  // Auto-search with debounce and safety checks
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedTerm = (term || '').trim();
      if (trimmedTerm.length >= 2 || trimmedTerm.length === 0) {
        handleSubmit();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [term, handleSubmit]);
  
  // Static filter options
  const ratingOptions = useMemo(() => [
    { id: "4", label: "4+ estrelas" },
    { id: "3", label: "3+ estrelas" },
    { id: "2", label: "2+ estrelas" },
    { id: "1", label: "1+ estrela" }
  ], []);

  const priceRangeOptions = useMemo(() => [
    { id: "preco-1", label: "Até R$ 50" },
    { id: "preco-2", label: "R$ 50 a R$ 100" },
    { id: "preco-3", label: "R$ 100 a R$ 200" },
    { id: "preco-4", label: "R$ 200 a R$ 500" },
    { id: "preco-5", label: "Acima de R$ 500" }
  ], []);
  
  // Handle segment clicks with safety checks
  const handleSegmentClick = (segmentId: string) => {
    if (segmentId === "all") {
      setSelectedSegmentId(null);
      setSelectedSegments([]);
      updateSegmentURL(null);
      return;
    }
    
    if (segmentId) {
      setSelectedSegments([segmentId]);
      setSelectedSegmentId(segmentId);
      updateSegmentURL(segmentId);
    }
  };
  
  // Handle store clicks with safety checks
  const handleLojaCardClick = (lojaId: string) => {
    if (lojaId && actions?.setLojas) {
      actions.setLojas([lojaId]);
    }
  };
  
  // Get current display name with safety checks
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
  const dynamicPaddingTop = hideHeader ? 0 : headerHeight;
  
  // Handle search input change with safety check
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e?.target?.value || '';
    setTerm(value);
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
        ratingOptions={ratingOptions}
        priceRangeOptions={priceRangeOptions}
        segmentOptions={Array.isArray(segmentOptions) ? segmentOptions : []}
        viewType={viewType}
        setViewType={setViewType}
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
        stores={safeStores}
        onLojaClick={handleLojaCardClick}
        storesError={null}
        currentCategoryName={currentCategoryName}
        filteredProdutos={Array.isArray(filteredProducts) ? filteredProducts : []}
        isLoading={isLoading}
        displayedProducts={Array.isArray(displayedProducts) ? displayedProducts : []}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadMoreProducts={actions?.loadMore || (() => {})}
        clearFilters={actions?.clearFilters || (() => {})}
        viewType={viewType}
        setViewType={setViewType}
      />
    </div>
  );
};

export default OptimizedMarketplaceScreen;
