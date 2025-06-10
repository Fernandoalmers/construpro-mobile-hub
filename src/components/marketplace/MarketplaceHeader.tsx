
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/use-cart';
import { FilterOption } from '@/hooks/use-product-filter';

// Import our new components
import MarketplaceHeaderTop from './components/MarketplaceHeaderTop';
import SearchBar from './components/SearchBar';
import FilterDialogs from './components/FilterDialogs';
import FilterChips from './components/FilterChips';
import SegmentCardsHeader from './components/SegmentCardsHeader';

interface MarketplaceHeaderProps {
  hideHeader: boolean;
  searchTerm: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments?: string[];
  selectedPriceRanges?: string[];
  selectedSegmentId?: string | null;
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
  hideHeader,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments = [],
  selectedPriceRanges = [],
  selectedSegmentId,
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
  const headerRef = useRef<HTMLDivElement>(null);

  // Calculate and report header height correctly
  useEffect(() => {
    const calculateHeight = () => {
      if (headerRef.current && onHeightChange) {
        const height = headerRef.current.offsetHeight;
        onHeightChange(height);
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
  }, [onHeightChange, selectedCategories, selectedLojas, selectedRatings, selectedSegments, selectedPriceRanges]);

  // Fix the store mapping to ensure proper format
  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome_loja || store.nome || 'Loja sem nome'
  }));

  return (
    <motion.div 
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm"
      initial={{ transform: 'translateY(0)' }}
      animate={{ 
        transform: hideHeader ? 'translateY(-100%)' : 'translateY(0)'
      }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart for smoother animation
      }}
    >
      <div className="bg-construPro-blue">
        <div className="p-4 pt-8">
          {/* Header Top with Back Button and Cart */}
          <div className="flex items-center justify-between mb-4">
            <MarketplaceHeaderTop cartCount={cartCount} />
          </div>
          
          {/* Search Bar - sem mostrar sugestões nesta tela */}
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={onSearchChange} 
            onSearch={onSearch} 
            showSuggestions={false} 
          />

          {/* Filter Dialogs */}
          <FilterDialogs 
            lojasOptions={lojasOptions} 
            allCategories={allCategories} 
            segmentOptions={segmentOptions} 
            priceRangeOptions={priceRangeOptions} 
            selectedLojas={selectedLojas} 
            selectedCategories={selectedCategories} 
            selectedSegments={selectedSegments} 
            selectedPriceRanges={selectedPriceRanges} 
            onLojaClick={onLojaClick} 
            onCategoryClick={onCategoryClick} 
            onSegmentClick={onSegmentClick} 
            onPriceRangeClick={onPriceRangeClick} 
          />
          
          {/* Selected Filter Chips */}
          <FilterChips 
            selectedCategories={selectedCategories} 
            selectedLojas={selectedLojas} 
            selectedRatings={selectedRatings} 
            selectedSegments={selectedSegments} 
            selectedPriceRanges={selectedPriceRanges} 
            allCategories={allCategories} 
            lojasOptions={lojasOptions} 
            ratingOptions={ratingOptions} 
            priceRangeOptions={priceRangeOptions} 
            segmentOptions={segmentOptions} 
            onCategoryClick={onCategoryClick} 
            onLojaClick={onLojaClick} 
            onRatingClick={onRatingClick} 
            onSegmentClick={onSegmentClick} 
            onPriceRangeClick={onPriceRangeClick} 
            clearFilters={clearFilters} 
          />
        </div>
        
        {/* Segment Cards Header - now inside the animated header */}
        <div className="bg-white">
          <SegmentCardsHeader 
            selectedSegment={selectedSegmentId}
            onSegmentClick={onSegmentClick}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceHeader;
