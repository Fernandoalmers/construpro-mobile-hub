
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
        />
      </div>
    </div>
  );
};

export default MarketplaceScreen;
