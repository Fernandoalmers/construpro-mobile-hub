
import { useEffect } from 'react';
import { useProductFilter } from '@/hooks/use-product-filter';

interface MarketplaceFiltersProps {
  initialCategories: string[];
  segmentFilteredProducts: any[];
  term: string;
  selectedSegmentId: string | null;
  setSelectedSegmentId: (id: string | null) => void;
  selectedSegments: string[];
  setSelectedSegments: (segments: string[]) => void;
  updateSegmentURL: (segmentId: string | null) => void;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  location: any;
  navigate: any;
}

export const useMarketplaceFilters = ({
  initialCategories,
  segmentFilteredProducts,
  term,
  selectedSegmentId,
  setSelectedSegmentId,
  selectedSegments,
  setSelectedSegments,
  updateSegmentURL,
  handleSearchChange,
  handleSubmit,
  location,
  navigate
}: MarketplaceFiltersProps) => {
  
  // Enhanced product filter with optimized pagination
  const {
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    ratingOptions,
    priceRangeOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    isLoadingMore,
    handleSearchChange: filterSearchChange,
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    handlePriceRangeClick,
    loadMoreProducts,
    clearFilters: originalClearFilters,
    setSelectedLojas,
    setPage
  } = useProductFilter({ 
    initialCategories, 
    initialProducts: segmentFilteredProducts,
    initialSearch: term || '' 
  });

  // Sync search term between useMarketplaceSearch and useProductFilter
  useEffect(() => {
    console.log('[MarketplaceFilters] Syncing search term:', term);
    if (filterSearchChange) {
      filterSearchChange(term || '');
    }
  }, [term, filterSearchChange]);

  // Debounce effect for automatic search and reset
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((term || '').trim().length >= 2) {
        console.log('[MarketplaceFilters] Auto-searching for:', term);
        handleSubmit();
      } else if ((term || '').trim().length === 0) {
        console.log('[MarketplaceFilters] Search cleared, showing all products');
        handleSubmit();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [term, handleSubmit]);

  // Update URL when search term changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const newSearchParams = new URLSearchParams(searchParams);
    if (term && term.trim().length >= 2) {
      newSearchParams.set('search', term);
    } else {
      newSearchParams.delete('search');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  }, [term, location.pathname, navigate, location.search]);

  // Modified clearFilters function that preserves segment selection
  const clearFilters = () => {
    if (originalClearFilters) {
      originalClearFilters();
    }
    console.log('[MarketplaceFilters] Clearing filters but preserving segment:', selectedSegmentId);
    
    if (selectedSegmentId && selectedSegmentId !== "all") {
      updateSegmentURL(selectedSegmentId);
    }
    
    if (setPage) {
      setPage(1);
    }
  };
  
  // Segment filter handling
  const handleSegmentClick = (segmentId: string) => {
    console.log('[MarketplaceFilters] Segment clicked:', segmentId);
    
    if (segmentId === "all") {
      setSelectedSegmentId(null);
      setSelectedSegments([]);
      updateSegmentURL(null);
      return;
    }
    
    setSelectedSegments([segmentId]);
    setSelectedSegmentId(segmentId);
    updateSegmentURL(segmentId);
    if (setPage) {
      setPage(1);
    }
  };

  // Re-enabled loja click functionality with improved logging
  const handleLojaCardClick = (lojaId: string) => {
    console.log('[MarketplaceFilters] Store card clicked:', lojaId);
    console.log('[MarketplaceFilters] Current selected lojas:', selectedLojas);
    
    if (setSelectedLojas) {
      setSelectedLojas([lojaId]);
    }
    if (setPage) {
      setPage(1);
    }
    
    console.log('[MarketplaceFilters] Store filter applied for:', lojaId);
  };

  return {
    // Filter state
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    ratingOptions,
    priceRangeOptions,
    
    // Filtered data
    filteredProdutos,
    displayedProducts,
    hasMore,
    isLoadingMore,
    
    // Handlers
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    handlePriceRangeClick,
    loadMoreProducts,
    clearFilters,
    handleSegmentClick,
    handleLojaCardClick
  };
};
