
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
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  stores?: any[];
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (term: string) => void;
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (ratingId: string) => void;
  clearFilters: () => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  hideHeader,
  searchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  allCategories,
  ratingOptions,
  stores = [],
  onSearchChange,
  onSearch,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  clearFilters
}) => {
  const { cartCount } = useCart();

  const lojasOptions = stores.map(store => ({
    id: store.id,
    label: store.nome
  }));

  return (
    <AnimatePresence>
      <motion.div 
        className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm"
        initial={{ translateY: 0 }}
        animate={{ 
          translateY: hideHeader ? '-60%' : 0,
          opacity: hideHeader ? 0.5 : 1
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-construPro-blue p-4 pt-8">
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
            ratingOptions={ratingOptions}
            selectedLojas={selectedLojas}
            selectedCategories={selectedCategories}
            selectedRatings={selectedRatings}
            onLojaClick={onLojaClick}
            onCategoryClick={onCategoryClick}
            onRatingClick={onRatingClick}
          />
          
          {/* Selected Filter Chips */}
          <FilterChips
            selectedCategories={selectedCategories}
            selectedLojas={selectedLojas}
            selectedRatings={selectedRatings}
            allCategories={allCategories}
            lojasOptions={lojasOptions}
            ratingOptions={ratingOptions}
            onCategoryClick={onCategoryClick}
            onLojaClick={onLojaClick}
            onRatingClick={onRatingClick}
            clearFilters={clearFilters}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MarketplaceHeader;
