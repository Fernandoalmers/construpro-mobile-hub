
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { useProductSearch } from '@/hooks/useProductSearch';
import ProductListSection from './ProductListSection';
import CategoryHeader from './components/CategoryHeader';
import SearchAndFilterSection from './components/SearchAndFilterSection';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '../common/LoadingState';
import { getProductSegments } from '@/services/admin/productSegmentsService';
import StoresSection from './components/StoresSection';
import SegmentCardsHeader from './components/SegmentCardsHeader';

const MarketplaceScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [headerHeight, setHeaderHeight] = useState(0);
  
  // Parse query parameters on component mount
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('categoria');
  const searchQuery = searchParams.get('search');
  const segmentIdParam = searchParams.get('segmento_id');
  
  // Only initialize categories from URL if we have a categoria param
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  // State for segment selection
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(segmentIdParam);
  const [selectedSegments, setSelectedSegments] = useState<string[]>(
    segmentIdParam ? [segmentIdParam] : []
  );
  const [segmentOptions, setSegmentOptions] = useState<any[]>([]);
  
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
    initialSearch: searchQuery || '' 
  });

  // Log debug info
  useEffect(() => {
    console.log('[MarketplaceScreen] URL parameters:', {
      categoria: categoryParam,
      segmento_id: segmentIdParam,
      search: searchQuery
    });
    
    if (segmentIdParam) {
      console.log(`[MarketplaceScreen] Initializing with segment_id: ${segmentIdParam}`);
    }
    
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
  }, [categoryParam, segmentIdParam, searchQuery, products.length, isLoading]);
  
  // Fetch segments for filter options
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const segmentsData = await getProductSegments();
        console.log('[MarketplaceScreen] Fetched segments:', segmentsData);
        const options = segmentsData.map(segment => ({
          id: segment.id,
          label: segment.nome
        }));
        setSegmentOptions(options);
      } catch (error) {
        console.error('[MarketplaceScreen] Error fetching segments:', error);
      }
    };
    
    fetchSegments();
  }, []);

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
  
  // Update URL with segment ID
  const updateSegmentURL = (segmentId: string | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (categoryParam) {
      newSearchParams.delete('categoria');
    }
    
    if (segmentId) {
      newSearchParams.set('segmento_id', segmentId);
    } else {
      newSearchParams.delete('segmento_id');
    }
    
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  };

  // Enhanced search functionality
  const fetchProducts = (term: string) => {
    console.log('[MarketplaceScreen] Searching for:', term);
    handleSearchChange(term);
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (term && term.trim().length >= 2) {
      newSearchParams.set('search', term);
    } else {
      newSearchParams.delete('search');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  };
  
  const { term, setTerm, handleSubmit } = useProductSearch(fetchProducts);

  // Re-enabled loja click functionality with improved logging
  const handleLojaCardClick = (lojaId: string) => {
    console.log('[MarketplaceScreen] Store card clicked:', lojaId);
    console.log('[MarketplaceScreen] Current selected lojas:', selectedLojas);
    
    // Re-enable store filtering
    setSelectedLojas([lojaId]);
    setPage(1);
    
    console.log('[MarketplaceScreen] Store filter applied for:', lojaId);
  };

  // Quick search functionality
  const handleQuickSearch = async (term: string) => {
    console.log('[MarketplaceScreen] Quick search for:', term);
    if (!term || term.trim().length < 2) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id')
        .ilike('nome', `%${term}%`)
        .eq('status', 'aprovado')
        .limit(1)
        .single();
      
      if (error || !data) {
        console.error('[MarketplaceScreen] Quick search error:', error);
        return;
      }
      
      navigate(`/produto/${data.id}`);
    } catch (error) {
      console.error('[MarketplaceScreen] Error in quick search:', error);
    }
  };

  // Initialize search term from URL
  useEffect(() => {
    if (searchQuery) {
      setTerm(searchQuery);
    }
  }, [searchQuery]);

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
      
      {/* Main Content with Dynamic Padding */}
      <div 
        className="transition-all duration-300 ease-out"
        style={{ 
          paddingTop: `${dynamicPaddingTop}px`
        }}
      >
        {/* Segment Cards Header */}
        <SegmentCardsHeader 
          selectedSegment={selectedSegmentId}
          onSegmentClick={handleSegmentClick}
        />
        
        {/* Stores Section */}
        <StoresSection 
          stores={stores}
          onLojaClick={handleLojaCardClick}
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
              onLojaClick={handleLojaCardClick}
              isLoading={isLoading}
              viewType="list"
              showActions={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceScreen;
