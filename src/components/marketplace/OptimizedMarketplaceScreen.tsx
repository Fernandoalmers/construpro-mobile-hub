
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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use optimized marketplace data hook
  const { products, stores, segments, isLoading, error } = useOptimizedMarketplace();
  
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
  
  // Filter products by selected segment
  const segmentFilteredProducts = useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      return products;
    }
    return products.filter(product => product.segmento_id === selectedSegmentId);
  }, [products, selectedSegmentId]);
  
  // Use optimized product filter
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
  
  // Extract categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(product => product.categoria));
    return Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, [products]);
  
  // Sync search term
  useEffect(() => {
    actions.setSearchTerm(term || '');
  }, [term, actions.setSearchTerm]);
  
  // Auto-search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (term.trim().length >= 2 || term.trim().length === 0) {
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
  
  // Handle segment clicks
  const handleSegmentClick = (segmentId: string) => {
    if (segmentId === "all") {
      setSelectedSegmentId(null);
      setSelectedSegments([]);
      updateSegmentURL(null);
      return;
    }
    
    setSelectedSegments([segmentId]);
    setSelectedSegmentId(segmentId);
    updateSegmentURL(segmentId);
  };
  
  // Handle store clicks
  const handleLojaCardClick = (lojaId: string) => {
    actions.setLojas([lojaId]);
  };
  
  // Get current display name
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
  const dynamicPaddingTop = hideHeader ? 0 : headerHeight;
  
  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
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
        onSearch={handleSubmit}
        onLojaClick={actions.toggleLoja}
        onCategoryClick={actions.toggleCategory}
        onRatingClick={actions.toggleRating}
        onSegmentClick={handleSegmentClick}
        onPriceRangeClick={actions.togglePriceRange}
        clearFilters={actions.clearFilters}
        stores={stores}
        onHeightChange={setHeaderHeight}
      />
      
      <MarketplaceContent
        dynamicPaddingTop={dynamicPaddingTop}
        stores={stores}
        onLojaClick={handleLojaCardClick}
        storesError={null}
        currentCategoryName={currentCategoryName}
        filteredProdutos={filteredProducts}
        isLoading={isLoading}
        displayedProducts={displayedProducts}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadMoreProducts={actions.loadMore}
        clearFilters={actions.clearFilters}
      />
    </div>
  );
};

export default OptimizedMarketplaceScreen;
