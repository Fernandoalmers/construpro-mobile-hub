
import React from 'react';
import { useScrollBehavior } from '@/hooks/use-scroll-behavior';
import MarketplaceHeader from '../MarketplaceHeader';
import MarketplaceContent from './MarketplaceContent';

interface MarketplaceDisplayProps {
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
  viewType: 'grid' | 'list';
  setViewType: (type: 'grid' | 'list') => void;
  term: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments: string[];
  selectedPriceRanges: string[];
  selectedSegmentId: string | null;
  categories: any[];
  ratingOptions: any[];
  priceRangeOptions: any[];
  segmentOptions: any[];
  safeStores: any[];
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExplicitSearch: () => void;
  handleLojaClick: (lojaId: string) => void;
  handleCategoryClick: (categoryId: string) => void;
  handleRatingClick: (ratingId: string) => void;
  handleSegmentClick: (segmentId: string) => void;
  handlePriceRangeClick: (rangeId: string) => void;
  clearFilters: () => void;
  handleLojaCardClick: (lojaId: string) => void;
  currentCategoryName: string;
  filteredProdutos: any[];
  isLoading: boolean;
  displayedProducts: any[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreProducts: () => void;
}

export const MarketplaceDisplay: React.FC<MarketplaceDisplayProps> = ({
  headerHeight,
  setHeaderHeight,
  viewType,
  setViewType,
  term,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments,
  selectedPriceRanges,
  selectedSegmentId,
  categories,
  ratingOptions,
  priceRangeOptions,
  segmentOptions,
  safeStores,
  handleSearchInputChange,
  handleExplicitSearch,
  handleLojaClick,
  handleCategoryClick,
  handleRatingClick,
  handleSegmentClick,
  handlePriceRangeClick,
  clearFilters,
  handleLojaCardClick,
  currentCategoryName,
  filteredProdutos,
  isLoading,
  displayedProducts,
  hasMore,
  isLoadingMore,
  loadMoreProducts
}) => {
  const { hideHeader } = useScrollBehavior();
  
  // Calculate dynamic padding based on header visibility and height
  const dynamicPaddingTop = hideHeader ? 0 : headerHeight;

  // Handle header height changes
  const handleHeaderHeightChange = (height: number) => {
    setHeaderHeight(height);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header - completely outside layout flow */}
      <MarketplaceHeader 
        hideHeader={hideHeader}
        searchTerm={term || ''}
        selectedCategories={Array.isArray(selectedCategories) ? selectedCategories : []}
        selectedLojas={Array.isArray(selectedLojas) ? selectedLojas : []}
        selectedRatings={Array.isArray(selectedRatings) ? selectedRatings : []}
        selectedSegments={Array.isArray(selectedSegments) ? selectedSegments : []}
        selectedPriceRanges={Array.isArray(selectedPriceRanges) ? selectedPriceRanges : []}
        selectedSegmentId={selectedSegmentId}
        viewType={viewType}
        setViewType={setViewType}
        allCategories={Array.isArray(categories) ? categories : []}
        ratingOptions={Array.isArray(ratingOptions) ? ratingOptions : []}
        priceRangeOptions={Array.isArray(priceRangeOptions) ? priceRangeOptions : []}
        segmentOptions={Array.isArray(segmentOptions) ? segmentOptions : []}
        onSearchChange={handleSearchInputChange}
        onSearch={handleExplicitSearch}
        onLojaClick={handleLojaClick || (() => {})}
        onCategoryClick={handleCategoryClick || (() => {})}
        onRatingClick={handleRatingClick || (() => {})}
        onSegmentClick={handleSegmentClick}
        onPriceRangeClick={handlePriceRangeClick || (() => {})}
        clearFilters={clearFilters}
        stores={safeStores}
        onHeightChange={handleHeaderHeightChange}
      />
      
      {/* Main Content with dynamic padding */}
      <MarketplaceContent
        dynamicPaddingTop={dynamicPaddingTop}
        stores={safeStores}
        onLojaClick={handleLojaCardClick}
        storesError={null}
        currentCategoryName={currentCategoryName}
        filteredProdutos={Array.isArray(filteredProdutos) ? filteredProdutos : []}
        isLoading={isLoading}
        displayedProducts={Array.isArray(displayedProducts) ? displayedProducts : []}
        hasMore={hasMore || false}
        isLoadingMore={isLoadingMore || false}
        loadMoreProducts={loadMoreProducts || (() => {})}
        clearFilters={clearFilters}
        viewType={viewType}
      />
    </div>
  );
};
