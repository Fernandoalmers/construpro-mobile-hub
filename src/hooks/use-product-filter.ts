
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
  const [page, setPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;
  
  // Rating options 
  const ratingOptions: FilterOption[] = useMemo(() => ([
    { id: '4', label: '4+' },
    { id: '3', label: '3+' },
    { id: '2', label: '2+' },
    { id: '1', label: '1+' }
  ]), []);
  
  // Filter products
  const filteredProdutos = useMemo(() => {
    return initialProducts.filter(produto => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by category
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(produto.categoria);
      
      // Filter by store
      const matchesLoja = selectedLojas.length === 0 || 
        selectedLojas.includes(produto.loja_id);
      
      // Filter by rating
      const matchesRating = selectedRatings.length === 0 || 
        selectedRatings.some(rating => produto.avaliacao >= parseInt(rating, 10));
      
      return matchesSearch && matchesCategory && matchesLoja && matchesRating;
    });
  }, [initialProducts, searchTerm, selectedCategories, selectedLojas, selectedRatings]);
  
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
    setSearchTerm(term);
    setPage(1);
  };
  
  // Handle category selection
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev => {
      return prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
    });
    setPage(1);
  };
  
  // Handle loja selection
  const handleLojaClick = (lojaId: string) => {
    setSelectedLojas(prev => {
      return prev.includes(lojaId)
        ? prev.filter(id => id !== lojaId)
        : [...prev, lojaId];
    });
    setPage(1);
  };
  
  // Handle rating selection
  const handleRatingClick = (ratingId: string) => {
    setSelectedRatings(prev => {
      return prev.includes(ratingId)
        ? prev.filter(id => id !== ratingId)
        : [...prev, ratingId];
    });
    setPage(1);
  };
  
  // Load more products
  const loadMoreProducts = () => {
    setPage(prev => prev + 1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedLojas([]);
    setSelectedRatings([]);
    setPage(1);
  };
  
  return {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    ratingOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    page,
    handleSearchChange,
    handleCategoryClick,
    handleLojaClick,
    handleRatingClick,
    loadMoreProducts,
    clearFilters,
    setSelectedLojas,
    setPage
  };
};
