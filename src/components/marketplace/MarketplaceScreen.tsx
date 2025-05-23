
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
  // This change prevents initializing with category when we only have segmento_id
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  // State for segment selection - properly initialize with segmentIdParam
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(segmentIdParam);
  // Important: Initialize selectedSegments with segmentIdParam if it exists
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
  
  // Log the incoming navigation parameters
  useEffect(() => {
    console.log('[MarketplaceScreen] URL parameters:', {
      categoria: categoryParam,
      segmento_id: segmentIdParam,
      search: searchQuery
    });
    
    if (segmentIdParam) {
      console.log(`[MarketplaceScreen] Initializing with segment_id: ${segmentIdParam}`);
    }
  }, [categoryParam, segmentIdParam, searchQuery]);
  
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
  
  // Filter products based on segment as well
  const {
    selectedCategories,
    selectedLojas,
    selectedRatings,
    ratingOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    handleSearchChange,
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    loadMoreProducts,
    clearFilters: originalClearFilters,
    setSelectedLojas,
    setPage
  } = useProductFilter({ 
    initialCategories, 
    initialProducts: products,
    initialSearch: searchQuery || '' 
  });

  // Modified clearFilters function that preserves segment selection
  const clearFilters = () => {
    // Call the original clearFilters but we'll keep the segment selection
    originalClearFilters();
    
    // Log what we're keeping
    console.log('[MarketplaceScreen] Clearing filters but preserving segment:', selectedSegmentId);
    
    // Make sure URL is updated to reflect we're keeping the segment
    if (selectedSegmentId && selectedSegmentId !== "all") {
      updateSegmentURL(selectedSegmentId);
    }
    
    // Reset page
    setPage(1);
  };
  
  // Segment filter handling
  const handleSegmentClick = (segmentId: string) => {
    console.log('[MarketplaceScreen] Segment clicked:', segmentId);
    
    // Special handling for "all" segment
    if (segmentId === "all") {
      setSelectedSegmentId(null);
      setSelectedSegments([]);
      updateSegmentURL(null);
      return;
    }
    
    // For single segment selection, replace the array
    setSelectedSegments([segmentId]);
    
    // Update the selectedSegmentId for the data fetching
    setSelectedSegmentId(segmentId);
    
    // Update URL with segment ID
    updateSegmentURL(segmentId);
    
    // Reset page
    setPage(1);
  };
  
  // Update URL with segment ID
  const updateSegmentURL = (segmentId: string | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Clear the categoria parameter if segmentId is changing
    // This ensures we don't have both category and segment filters
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

  // Enhanced search functionality with our custom hook
  const fetchProducts = (term: string) => {
    console.log('[MarketplaceScreen] Searching for:', term);
    handleSearchChange(term);
    
    // Update URL with search term
    const newSearchParams = new URLSearchParams(searchParams);
    if (term) {
      newSearchParams.set('search', term);
    } else {
      newSearchParams.delete('search');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  };
  
  const { term, setTerm, handleSubmit } = useProductSearch(fetchProducts);

  // Modified: Handle loja click from product card - this function is now disabled
  // to prevent accidental filtering when clicking on store names
  const handleLojaCardClick = (lojaId: string) => {
    // Removed functionality to prevent filtering by store when clicking on store cards
    console.log('[MarketplaceScreen] Store card click detected but filtering disabled');
    // No longer setting the selected store filter:
    // setSelectedLojas([lojaId]);
    // setPage(1);
  };

  // Quick search for products with improved logging
  const handleQuickSearch = async (term: string) => {
    console.log('[MarketplaceScreen] Quick search for:', term);
    if (!term || term.trim().length < 2) {
      console.log('[MarketplaceScreen] Search term too short, ignoring');
      return;
    }
    
    try {
      console.log('[MarketplaceScreen] Running quick search Supabase query');
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .ilike('nome', `%${term}%`)
        .limit(1)
        .single();
      
      if (error || !data) {
        console.error('[MarketplaceScreen] Quick search error or no results:', error);
        return;
      }
      
      // Navigate to first product that matches the search
      console.log('[MarketplaceScreen] Quick search found product, navigating to:', data.id);
      navigate(`/produto/${data.id}`);
    } catch (error) {
      console.error('[MarketplaceScreen] Error in quick search:', error);
    }
  };

  // Initialize search term from URL
  useEffect(() => {
    if (searchQuery) {
      console.log('[MarketplaceScreen] Setting search term from URL:', searchQuery);
      setTerm(searchQuery);
    }
  }, [searchQuery]);

  // Add debug logging when products array changes
  useEffect(() => {
    if (selectedSegmentId) {
      console.log(`[MarketplaceScreen] Products with segmento_id=${selectedSegmentId}:`, 
                 products.filter(p => p.segmento_id === selectedSegmentId).length);
      console.log('[MarketplaceScreen] Filtered products count:', filteredProdutos.length);
      console.log('[MarketplaceScreen] Selected segments:', selectedSegments);
    }
  }, [products, selectedSegmentId, filteredProdutos, selectedSegments]);

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
        allCategories={categories}
        ratingOptions={ratingOptions}
        segmentOptions={segmentOptions}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
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
        onLojaClick={handleLojaClick}
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
            loadMoreProducts={loadMoreProducts}
            clearFilters={clearFilters}
            onLojaClick={handleLojaCardClick}
            isLoading={isLoading}
            viewType="list" // Default to list view to match Mercado Livre style
            showActions={true}
          />
        )}
      </div>
    </div>
  );
};

export default MarketplaceScreen;
