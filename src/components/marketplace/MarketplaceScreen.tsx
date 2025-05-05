
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
  const segmentParam = searchParams.get('segmento');
  
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  // State for segment selection - moved above useMarketplaceData
  const [selectedSegment, setSelectedSegment] = useState<string | null>(segmentParam);
  
  // Use our custom hooks
  const { hideHeader } = useScrollBehavior();
  const { products, stores, isLoading, storesError } = useMarketplaceData(selectedSegment);
  
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
    console.log('Searching for:', term);
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

  // Handle segment selection
  const handleSegmentClick = (segmentId: string) => {
    // Toggle segment selection
    const newSegment = selectedSegment === segmentId ? null : segmentId;
    setSelectedSegment(newSegment);
    
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSegment) {
      newSearchParams.set('segmento', newSegment);
    } else {
      newSearchParams.delete('segmento');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
    
    // Reset page
    setPage(1);
  };

  // Handle loja click from product card
  const handleLojaCardClick = (lojaId: string) => {
    setSelectedLojas([lojaId]);
    setPage(1);
  };

  // Quick search for products
  const handleQuickSearch = async (term: string) => {
    if (!term || term.trim().length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .ilike('nome', `%${term}%`)
        .limit(1)
        .single();
      
      if (error || !data) return;
      
      // Navigate to first product that matches the search
      navigate(`/produto/${data.id}`);
    } catch (error) {
      console.error('Error in quick search:', error);
    }
  };

  // Initialize search term from URL
  useEffect(() => {
    if (searchQuery) {
      setTerm(searchQuery);
    }
  }, [searchQuery]);

  // Current category name for display
  const currentCategoryName = selectedCategories.length === 1 ? 
    categories.find(cat => cat.id === selectedCategories[0])?.label : 
    selectedSegment ? 
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
        selectedSegment={selectedSegment} 
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
