
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MarketplaceHeader from '../MarketplaceHeader';
import { FilterOption } from '@/hooks/use-product-filter';

interface SearchAndFilterSectionProps {
  hideHeader: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedSegments?: string[];
  selectedPriceRanges?: string[];
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  priceRangeOptions?: FilterOption[];
  segmentOptions?: FilterOption[];
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (rating: string) => void;
  onSegmentClick?: (segmentId: string) => void;
  onPriceRangeClick?: (rangeId: string) => void;
  onSearch: (term: string) => void;
  clearFilters: () => void;
  stores: any[];
  handleSearchChange: (term: string) => void;
}

const SearchAndFilterSection: React.FC<SearchAndFilterSectionProps> = ({
  hideHeader,
  searchTerm,
  setSearchTerm,
  selectedCategories,
  selectedLojas,
  selectedRatings,
  selectedSegments = [],
  selectedPriceRanges = [],
  allCategories,
  ratingOptions,
  priceRangeOptions = [],
  segmentOptions = [],
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  onSegmentClick = () => {},
  onPriceRangeClick = () => {},
  onSearch,
  clearFilters,
  stores,
  handleSearchChange
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  // Debounce effect for automatic search and reset
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        console.log('[SearchAndFilterSection] Auto-searching for:', searchTerm);
        onSearch(searchTerm);
      } else if (searchTerm.trim().length === 0) {
        // When search is cleared, reset to show all products
        console.log('[SearchAndFilterSection] Search cleared, showing all products');
        onSearch('');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  // Update URL when search term changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (searchTerm && searchTerm.trim().length >= 2) {
      newSearchParams.set('search', searchTerm);
    } else {
      // Remove search parameter when term is cleared or too short
      newSearchParams.delete('search');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  }, [searchTerm, location.pathname, navigate]);

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[SearchAndFilterSection] Input change event:', e.target.value);
    setSearchTerm(e.target.value);
  };

  // Explicit search functionality
  const handleExplicitSearch = () => {
    console.log('[SearchAndFilterSection] Explicit search with term:', searchTerm);
    if (searchTerm.trim().length >= 2) {
      onSearch(searchTerm);
    } else if (searchTerm.trim().length === 0) {
      // Handle explicit search with empty term
      onSearch('');
    }
  };

  return (
    <MarketplaceHeader 
      hideHeader={hideHeader}
      searchTerm={searchTerm}
      selectedCategories={selectedCategories}
      selectedLojas={selectedLojas}
      selectedRatings={selectedRatings}
      selectedSegments={selectedSegments}
      selectedPriceRanges={selectedPriceRanges}
      allCategories={allCategories}
      ratingOptions={ratingOptions}
      priceRangeOptions={priceRangeOptions}
      segmentOptions={segmentOptions}
      onSearchChange={handleSearchInputChange}
      onSearch={handleExplicitSearch}
      onLojaClick={onLojaClick}
      onCategoryClick={onCategoryClick}
      onRatingClick={onRatingClick}
      onSegmentClick={onSegmentClick}
      onPriceRangeClick={onPriceRangeClick}
      clearFilters={clearFilters}
      stores={stores}
    />
  );
};

// Separate hook for search functionality - moved to its own file to avoid conflicts
export const useProductSearch = (initialTerm = '', onSearch: (term: string) => void) => {
  const [searchTerm, setSearchTerm] = useState(initialTerm);
  const [debouncedTerm, setDebouncedTerm] = useState(initialTerm);
  
  // Debounce search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Trigger search when debounced term changes - FIXED: also handle empty search
  useEffect(() => {
    if (debouncedTerm.trim().length >= 2) {
      console.log('[useProductSearch] Searching for:', debouncedTerm);
      onSearch(debouncedTerm);
    } else if (debouncedTerm.trim().length === 0) {
      // When search is cleared, reset to show all products
      console.log('[useProductSearch] Search cleared, showing all products');
      onSearch('');
    }
  }, [debouncedTerm, onSearch]);
  
  return { searchTerm, setSearchTerm, debouncedTerm };
};

export default SearchAndFilterSection;
