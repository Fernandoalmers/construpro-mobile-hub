
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import MarketplaceHeader from './MarketplaceHeader';
import ProductListSection from './ProductListSection';
import { supabase } from '@/integrations/supabase/client';

const MarketplaceScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query parameters on component mount
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('categoria');
  const searchQuery = searchParams.get('search');
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  
  // Use our custom hooks
  const { hideHeader } = useScrollBehavior();
  
  // Fetch products and stores from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            stores:loja_id(*)
          `)
          .order('nome');
        
        if (productsError) throw productsError;
        
        // Fetch stores
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('*');
        
        if (storesError) throw storesError;
        
        setProducts(productsData || []);
        setStores(storesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Extract all categories from products
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(products.map(product => product.categoria));
    return Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, [products]);
  
  // Filter products
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

  // Handle loja click from product card
  const handleLojaCardClick = (lojaId: string) => {
    setSelectedLojas([lojaId]);
    setPage(1);
  };

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
    setSearchTerm(e.target.value);
    
    // Update URL with search parameter
    const newSearchParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newSearchParams.set('search', e.target.value);
    } else {
      newSearchParams.delete('search');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
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

  // Current category name for display
  const currentCategoryName = selectedCategories.length === 1 ? 
    categories.find(cat => cat.id === selectedCategories[0])?.label : 
    "Produtos";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header with search and filters */}
      <MarketplaceHeader 
        hideHeader={hideHeader}
        searchTerm={searchTerm}
        selectedCategories={selectedCategories}
        selectedLojas={selectedLojas}
        selectedRatings={selectedRatings}
        allCategories={categories}
        ratingOptions={ratingOptions}
        onSearchChange={handleSearchInputChange}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
        onSearch={handleQuickSearch}
        clearFilters={clearFilters}
        stores={stores}
      />
      
      {/* Simple category header */}
      <div className="bg-white px-3 py-2 border-b shadow-sm">
        <div className="flex items-center">
          <span className="text-sm font-medium">{currentCategoryName}</span>
          <span className="text-xs text-gray-500 mx-2">({filteredProdutos.length})</span>
        </div>
      </div>
      
      {/* Product List */}
      <div className="px-2 py-2 flex-1">
        <ProductListSection 
          displayedProducts={displayedProducts}
          filteredProdutos={filteredProdutos}
          hasMore={hasMore}
          loadMoreProducts={loadMoreProducts}
          clearFilters={clearFilters}
          onLojaClick={handleLojaCardClick}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default MarketplaceScreen;
