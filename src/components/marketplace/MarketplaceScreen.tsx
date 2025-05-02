
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
        onSearchChange={handleSearchChange}
        onLojaClick={handleLojaClick}
        onCategoryClick={handleCategoryClick}
        onRatingClick={handleRatingClick}
        clearFilters={clearFilters}
      />
      
      {/* Product List */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">
            {filteredProdutos.length} produtos encontrados
          </h2>
        </div>

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
