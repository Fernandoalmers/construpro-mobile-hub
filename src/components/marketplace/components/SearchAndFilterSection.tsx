
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

// Separate hook for search functionality
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
  
  // Trigger search when debounced term changes
  useEffect(() => {
    if (debouncedTerm.trim().length >= 2) {
      onSearch(debouncedTerm);
    }
  }, [debouncedTerm, onSearch]);
  
  return { searchTerm, setSearchTerm, debouncedTerm };
};

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

  // Use our custom search hook
  const { debouncedTerm } = useProductSearch(searchTerm, handleSearchChange);

  // Update URL when search term changes
  useEffect(() => {
    if (debouncedTerm && debouncedTerm.trim().length >= 2) {
      const newSearchParams = new URLSearchParams(searchParams);
      if (debouncedTerm) {
        newSearchParams.set('search', debouncedTerm);
      } else {
        newSearchParams.delete('search');
      }
      navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
    }
  }, [debouncedTerm, location.pathname, navigate, searchParams]);

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Explicit search functionality
  const handleExplicitSearch = () => {
    if (searchTerm.trim().length >= 2) {
      onSearch(searchTerm);
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

export default SearchAndFilterSection;
