
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { useProductSearch } from '@/hooks/useProductSearch';
import ProductListSection from './ProductListSection';
import SegmentCardsHeader from './components/SegmentCardsHeader';
import StoresSection from './components/StoresSection';
import CategoryHeader from './components/CategoryHeader';
import SearchAndFilterSection from './components/SearchAndFilterSection';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '../common/LoadingState';

const MarketplaceScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query parameters on component mount
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('categoria');
  const searchQuery = searchParams.get('search');
  const segmentIdParam = searchParams.get('segmento_id');
  
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  // State for segment selection - using segmento_id now
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(segmentIdParam);
  
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
    clearFilters,
    setSelectedLojas,
    setPage
  } = useProductFilter({ 
    initialCategories, 
    initialProducts: products,
    initialSearch: searchQuery || '' 
  });

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

  // Handle segment selection with ID
  const handleSegmentClick = (segmentId: string) => {
    console.log('Segment clicked:', segmentId);
    
    // Toggle segment selection
    const newSegmentId = segmentId === 'all' ? null : 
                        (selectedSegmentId === segmentId ? null : segmentId);
    setSelectedSegmentId(newSegmentId);
    
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSegmentId) {
      newSearchParams.set('segmento_id', newSegmentId);
    } else {
      newSearchParams.delete('segmento_id');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
    
    // Reset page
    setPage(1);
  };

  // Handle loja click from product card
  const handleLojaCardClick = (lojaId: string) => {
    console.log('[MarketplaceScreen] Loja card clicked:', lojaId);
    setSelectedLojas([lojaId]);
    setPage(1);
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

  // Current category name for display
  const currentCategoryName = selectedCategories.length === 1 ? 
    categories.find(cat => cat.id === selectedCategories[0])?.label : 
    selectedSegmentId ? 
      "Produtos no segmento selecionado" : 
      "Todos os Produtos";

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
        allCategories={categories}
        ratingOptions={ratingOptions}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
        onSearch={handleSubmit}
        clearFilters={clearFilters}
        stores={stores}
        handleSearchChange={(term) => setTerm(term)}
      />
      
      {/* Segment Cards */}
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
