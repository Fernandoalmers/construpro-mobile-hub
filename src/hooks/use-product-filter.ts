
import { useState, useMemo } from 'react';

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterParams {
  initialCategories?: string[];
  initialProducts: any[];
  initialSearch?: string;
}

export const useProductFilter = ({
  initialCategories = [],
  initialProducts = [],
  initialSearch = ''
}: FilterParams) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;
  
  // Rating options - updated to match FilterOption structure
  const ratingOptions: FilterOption[] = useMemo(() => ([
    { id: '4', label: '4+' },
    { id: '3', label: '3+' },
    { id: '2', label: '2+' },
    { id: '1', label: '1+' }
  ]), []);

  // Price range options
  const priceRangeOptions: FilterOption[] = useMemo(() => ([
    { id: "preco-1", label: "Até R$ 50" },
    { id: "preco-2", label: "R$ 50 a R$ 100" },
    { id: "preco-3", label: "R$ 100 a R$ 200" },
    { id: "preco-4", label: "R$ 200 a R$ 500" },
    { id: "preco-5", label: "Acima de R$ 500" }
  ]), []);

  // Helper function to check if product price is in selected range
  const isPriceInRange = (preco: number, rangeId: string): boolean => {
    switch (rangeId) {
      case 'preco-1': return preco <= 50;
      case 'preco-2': return preco > 50 && preco <= 100;
      case 'preco-3': return preco > 100 && preco <= 200;
      case 'preco-4': return preco > 200 && preco <= 500;
      case 'preco-5': return preco > 500;
      default: return false;
    }
  };
  
  // Filter products
  const filteredProdutos = useMemo(() => {
    console.log('[useProductFilter] Filtering products...');
    console.log('[useProductFilter] Selected categories:', selectedCategories);
    console.log('[useProductFilter] Selected lojas:', selectedLojas);
    console.log('[useProductFilter] Selected price ranges:', selectedPriceRanges);
    console.log('[useProductFilter] Total products to filter:', initialProducts.length);

    return initialProducts.filter(produto => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by category
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(produto.categoria);
      
      // Filter by store - FIXED: check vendedor_id which is the correct field
      const matchesLoja = selectedLojas.length === 0 || 
        selectedLojas.some(lojaId => {
          // Use vendedor_id as the primary field to match with stores
          const storeId = produto.vendedor_id;
          
          const isMatch = storeId === lojaId;
          if (selectedLojas.length > 0) {
            console.log(`[useProductFilter] Product ${produto.nome} - Store ID: ${storeId}, Looking for: ${lojaId}, Match: ${isMatch}`);
          }
          return isMatch;
        });
      
      // Filter by rating
      const matchesRating = selectedRatings.length === 0 || 
        selectedRatings.some(rating => produto.avaliacao >= parseInt(rating, 10));

      // Filter by price ranges
      const matchesPrice = selectedPriceRanges.length === 0 || 
        selectedPriceRanges.some(rangeId => {
          const preco = produto.preco_normal || produto.preco || 0;
          return isPriceInRange(preco, rangeId);
        });
      
      return matchesSearch && matchesCategory && matchesLoja && matchesRating && matchesPrice;
    });
  }, [initialProducts, searchTerm, selectedCategories, selectedLojas, selectedRatings, selectedPriceRanges]);
  
  // Paginate results
  const displayedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProdutos.slice(start, end);
  }, [filteredProdutos, page]);
  
  // Check if there are more products to load
  const hasMore = useMemo(() => {
    return page * ITEMS_PER_PAGE < filteredProdutos.length;
  }, [filteredProdutos, page]);
  
  // Handle search input change
  const handleSearchChange = (term: string) => {
    console.log('[useProductFilter] Search term changed to:', term);
    setSearchTerm(term);
    setPage(1);
  };
  
  // Handle category selection
  const handleCategoryClick = (categoryId: string) => {
    console.log('[useProductFilter] Category clicked:', categoryId);
    setSelectedCategories(prev => {
      return prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
    });
    setPage(1);
  };
  
  // Handle loja selection
  const handleLojaClick = (lojaId: string) => {
    console.log('[useProductFilter] Loja clicked:', lojaId);
    setSelectedLojas(prev => {
      return prev.includes(lojaId)
        ? prev.filter(id => id !== lojaId)
        : [...prev, lojaId];
    });
    setPage(1);
  };
  
  // Handle rating selection
  const handleRatingClick = (ratingId: string) => {
    console.log('[useProductFilter] Rating clicked:', ratingId);
    setSelectedRatings(prev => {
      return prev.includes(ratingId)
        ? prev.filter(id => id !== ratingId)
        : [...prev, ratingId];
    });
    setPage(1);
  };

  // Handle price range selection
  const handlePriceRangeClick = (rangeId: string) => {
    console.log('[useProductFilter] Price range clicked:', rangeId);
    setSelectedPriceRanges(prev => {
      return prev.includes(rangeId)
        ? prev.filter(id => id !== rangeId)
        : [...prev, rangeId];
    });
    setPage(1);
  };
  
  // Load more products
  const loadMoreProducts = () => {
    setPage(prev => prev + 1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    console.log('[useProductFilter] Clearing all filters');
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedLojas([]);
    setSelectedRatings([]);
    setSelectedPriceRanges([]);
    setPage(1);
  };
  
  return {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    ratingOptions,
    priceRangeOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    page,
    handleSearchChange,
    handleCategoryClick,
    handleLojaClick,
    handleRatingClick,
    handlePriceRangeClick,
    loadMoreProducts,
    clearFilters,
    setSelectedLojas,
    setPage
  };
};
