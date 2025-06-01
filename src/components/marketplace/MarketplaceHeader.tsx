
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/use-cart';
import { FilterOption } from '@/hooks/use-product-filter';

// Import our new components
import { MarketplaceHeaderTop } from './components/MarketplaceHeaderTop';
import SearchBar from './components/SearchBar';
import FilterDialogs from './components/FilterDialogs';
import FilterChips from './components/FilterChips';

interface MarketplaceHeaderProps {
  hideHeader: boolean;
  searchTerm: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments?: string[];
  selectedPriceRanges?: string[];
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
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  hideHeader,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments = [],
  selectedPriceRanges = [],
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
  clearFilters
}) => {
  const { cartCount } = useCart();

  // Fix the store mapping to ensure proper format
  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome_loja || store.nome || 'Loja sem nome'
  }));

  console.log('[MarketplaceHeader] Raw stores data:', stores);
  console.log('[MarketplaceHeader] Mapped lojas options:', lojasOptions);
  console.log('[MarketplaceHeader] Selected lojas:', selectedLojas);

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <motion.div 
        className="bg-orange-600 p-4 pt-8"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: hideHeader ? 0.95 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Top with Back Button and Cart */}
        <MarketplaceHeaderTop cartCount={cartCount} />
        
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
      </motion.div>
    </div>
  );
};

export default MarketplaceHeader;
