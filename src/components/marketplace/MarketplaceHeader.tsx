
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/use-cart';
import { FilterOption } from '@/hooks/use-product-filter';

// Import our new components
import MarketplaceHeaderTop from './components/MarketplaceHeaderTop';
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
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  segmentOptions?: FilterOption[];
  stores?: any[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (ratingId: string) => void;
  onSegmentClick?: (segmentId: string) => void;
  clearFilters: () => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  hideHeader,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments = [],
  allCategories,
  ratingOptions,
  segmentOptions = [],
  stores = [],
  onSearchChange,
  onSearch,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  onSegmentClick = () => {},
  clearFilters
}) => {
  const { cartCount } = useCart();

  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome_loja
  }));

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <motion.div 
        className="bg-construPro-blue p-4 pt-8"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: hideHeader ? 0.95 : 1,
          // Removemos a transformação translateY que estava causando problemas visuais
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Top with Back Button and Cart */}
        <MarketplaceHeaderTop cartCount={cartCount} />
        
        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onSearch={onSearch}
        />

        {/* Filter Dialogs */}
        <FilterDialogs
          lojasOptions={lojasOptions}
          allCategories={allCategories}
          segmentOptions={segmentOptions}
          selectedLojas={selectedLojas}
          selectedCategories={selectedCategories}
          selectedSegments={selectedSegments}
          onLojaClick={onLojaClick}
          onCategoryClick={onCategoryClick}
          onSegmentClick={onSegmentClick}
        />
        
        {/* Selected Filter Chips */}
        <FilterChips
          selectedCategories={selectedCategories}
          selectedLojas={selectedLojas}
          selectedRatings={selectedRatings}
          selectedSegments={selectedSegments}
          allCategories={allCategories}
          lojasOptions={lojasOptions}
          ratingOptions={ratingOptions}
          segmentOptions={segmentOptions}
          onCategoryClick={onCategoryClick}
          onLojaClick={onLojaClick}
          onRatingClick={onRatingClick}
          onSegmentClick={onSegmentClick}
          clearFilters={clearFilters}
        />
      </motion.div>
    </div>
  );
};

export default MarketplaceHeader;
