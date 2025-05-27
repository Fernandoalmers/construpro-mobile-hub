import React, { useState, useEffect } from 'react';
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
  }, [categoryParam, segmentIdParam, searchQuery, products.length]);
  
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
  
  // Enhanced product filter with price range support
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

  // Log filter debug info - Ensure products are accessible to ALL users
  useEffect(() => {
    if (products.length > 0) {
      console.log('[MarketplaceScreen] Products loaded and accessible to ALL users:', products.length);
      console.log('[MarketplaceScreen] Sample product for store debugging:', products[0]);
      
      // Debug store IDs in products
      const storeIds = products.map(p => ({
        name: p.nome,
        vendedor_id: p.vendedor_id,
        loja_id: p.loja_id,
        stores: p.stores?.id
      }));
      console.log('[MarketplaceScreen] Store IDs in products:', storeIds.slice(0, 5));
    }
    
    if (stores.length > 0) {
      console.log('[MarketplaceScreen] Stores loaded:', stores.length);
      console.log('[MarketplaceScreen] Store IDs:', stores.map(s => s.id));
    }
  }, [products, stores]);

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

  // Enhanced search functionality - FIXED to handle empty search properly
  const fetchProducts = (term: string) => {
    console.log('[MarketplaceScreen] Searching for:', term);
    // CRUCIAL: Always call handleSearchChange, even with empty string
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
        .from('produtos') // Changed from 'products' to 'produtos'
        .select('id')
        .ilike('nome', `%${term}%`)
        .eq('status', 'aprovado') // Only search approved products
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

  // Debug logging when products change
  useEffect(() => {
    if (selectedSegmentId) {
      console.log(`[MarketplaceScreen] Products with segmento_id=${selectedSegmentId}:`, 
                 products.filter(p => p.segmento_id === selectedSegmentId).length);
      console.log('[MarketplaceScreen] Filtered products count:', filteredProdutos.length);
    }
  }, [products, selectedSegmentId, filteredProdutos]);

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
      />
      
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
          <LoadingState type="spinner" text="Carregando produtos para todos os usuários..." count={3} />
        ) : (
          <ProductListSection 
            displayedProducts={displayedProducts}
            filteredProdutos={filteredProdutos}
            hasMore={hasMore}
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
  );
};

export default MarketplaceScreen;
