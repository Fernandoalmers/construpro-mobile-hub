
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
  allCategories: FilterOption[];
  ratingOptions: FilterOption[];
  onLojaClick: (lojaId: string) => void;
  onCategoryClick: (categoryId: string) => void;
  onRatingClick: (rating: string) => void;
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
  allCategories,
  ratingOptions,
  onLojaClick,
  onCategoryClick,
  onRatingClick,
  onSearch,
  clearFilters,
  stores,
  handleSearchChange
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  // Add debouncing for instant search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        console.log('Debounced search for:', searchTerm);
        handleSearchChange(searchTerm);
        
        // Update URL with search parameter
        const newSearchParams = new URLSearchParams(searchParams);
        if (searchTerm) {
          newSearchParams.set('search', searchTerm);
        } else {
          newSearchParams.delete('search');
        }
        navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
      }
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [searchTerm, location.pathname, handleSearchChange, navigate, searchParams]);

  // Adapter function to convert the event to string
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // The handleSearchChange will be triggered by the debounced effect
  };

  // Implementar a funcionalidade de pesquisa explícita (quando o usuário pressiona enter ou clica no botão)
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
      allCategories={allCategories}
      ratingOptions={ratingOptions}
      onSearchChange={handleSearchInputChange}
      onSearch={handleExplicitSearch}
      onLojaClick={onLojaClick}
      onCategoryClick={onCategoryClick}
      onRatingClick={onRatingClick}
      clearFilters={clearFilters}
      stores={stores}
    />
  );
};

export default SearchAndFilterSection;
