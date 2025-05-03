
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import MarketplaceHeader from './MarketplaceHeader';
import ProductListSection from './ProductListSection';

const MarketplaceScreen: React.FC = () => {
  const location = useLocation();
  
  // Parse query parameters on component mount
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('categoria');
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  // Use our custom hooks
  const { hideHeader } = useScrollBehavior();
  const {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    allCategories,
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
  } = useProductFilter({ initialCategories });

  // Handle loja click from product card
  const handleLojaCardClick = (lojaId: string) => {
    setSelectedLojas([lojaId]);
    setPage(1);
  };

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  };

  // Current category name for display
  const currentCategoryName = selectedCategories.length === 1 ? 
    allCategories.find(cat => cat.id === selectedCategories[0])?.label : 
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
        allCategories={allCategories}
        ratingOptions={ratingOptions}
        onSearchChange={handleSearchInputChange}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
        clearFilters={clearFilters}
      />
      
      {/* Additional Filter Buttons */}
      <div className="bg-white px-3 py-2 border-b shadow-sm flex overflow-x-auto items-center space-x-2">
        <div className="flex items-center">
          <span className="text-sm font-medium whitespace-nowrap">{currentCategoryName}</span>
          <span className="text-xs text-gray-500 mx-2">({filteredProdutos.length})</span>
        </div>
        
        <div className="h-4 border-r border-gray-300 mx-1"></div>
        
        <button className="flex items-center text-sm whitespace-nowrap border border-gray-300 rounded-full px-3 py-1">
          <span>Marca</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        
        <button className="flex items-center text-sm whitespace-nowrap border border-gray-300 rounded-full px-3 py-1">
          <span>Filtros</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        <button className="flex items-center text-sm whitespace-nowrap border border-gray-300 rounded-full px-3 py-1">
          <span>Ordenar</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      </div>

      {/* Payment Options Banner */}
      <div className="bg-white px-4 py-2 border-b mb-1 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-green-600">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
        <span className="text-sm">Parcelamento sem juros</span>
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
        />
      </div>
    </div>
  );
};

export default MarketplaceScreen;
