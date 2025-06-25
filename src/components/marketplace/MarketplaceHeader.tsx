
import React, { useEffect, useRef } from 'react';
import { useCart } from '@/hooks/use-cart';
import { FilterOption } from '@/hooks/use-product-filter';
import FixedHeaderTop from './components/FixedHeaderTop';
import CollapsibleFiltersSection from './components/CollapsibleFiltersSection';

interface MarketplaceHeaderProps {
  hideFilters: boolean;
  searchTerm: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments?: string[];
  selectedPriceRanges?: string[];
  selectedSegmentId?: string | null;
  viewType?: 'grid' | 'list';
  setViewType?: (type: 'grid' | 'list') => void;
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  priceRangeOptions?: FilterOption[];
  segmentOptions?: FilterOption[];
  stores?: any[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (ratingId: string) => void;
  onSegmentClick?: (segmentId: string) => void;
  onPriceRangeClick?: (rangeId: string) => void;
  clearFilters: () => void;
  onHeightChange?: (height: number) => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  hideFilters,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments = [],
  selectedPriceRanges = [],
  selectedSegmentId,
  viewType = 'grid',
  setViewType = () => {},
  allCategories,
  ratingOptions,
  priceRangeOptions = [],
  segmentOptions = [],
  stores = [],
  onSearchChange,
  onSearch,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  onSegmentClick = () => {},
  onPriceRangeClick = () => {},
  clearFilters,
  onHeightChange
}) => {
  const { cartCount } = useCart();
  const fixedHeaderRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Calculate and report header height correctly
  useEffect(() => {
    const calculateHeight = () => {
      if (fixedHeaderRef.current && filtersRef.current && onHeightChange) {
        const fixedHeight = fixedHeaderRef.current.offsetHeight;
        const filtersHeight = hideFilters ? 0 : filtersRef.current.offsetHeight;
        const totalHeight = fixedHeight + filtersHeight;
        onHeightChange(totalHeight);
      }
    };

    // Calculate height immediately and after DOM updates
    const timeoutId = setTimeout(calculateHeight, 0);
    calculateHeight();
    
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
      clearTimeout(timeoutId);
    };
  }, [onHeightChange, hideFilters, selectedCategories, selectedLojas, selectedRatings, selectedSegments, selectedPriceRanges]);

  // Fix the store mapping to ensure proper format
  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome_loja || store.nome || 'Loja sem nome'
  }));

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      {/* Fixed Header Top - Always Visible */}
      <div ref={fixedHeaderRef}>
        <FixedHeaderTop
          cartCount={cartCount}
          viewType={viewType}
          setViewType={setViewType}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onSearch={onSearch}
        />
      </div>

      {/* Collapsible Filters Section */}
      <div ref={filtersRef}>
        <CollapsibleFiltersSection
          hideFilters={hideFilters}
          selectedCategories={selectedCategories}
          selectedLojas={selectedLojas}
          selectedRatings={selectedRatings}
          selectedSegments={selectedSegments}
          selectedPriceRanges={selectedPriceRanges}
          selectedSegmentId={selectedSegmentId}
          allCategories={allCategories}
          ratingOptions={ratingOptions}
          priceRangeOptions={priceRangeOptions}
          segmentOptions={segmentOptions}
          lojasOptions={lojasOptions}
          onLojaClick={onLojaClick}
          onCategoryClick={onCategoryClick}
          onRatingClick={onRatingClick}
          onSegmentClick={onSegmentClick}
          onPriceRangeClick={onPriceRangeClick}
          clearFilters={clearFilters}
        />
      </div>
    </div>
  );
};

export default MarketplaceHeader;
