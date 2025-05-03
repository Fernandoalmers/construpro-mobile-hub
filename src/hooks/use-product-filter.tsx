
import { useState, useEffect } from 'react';

export interface FilterOption {
  id: string;
  label: string;
}

interface ProductFilterProps {
  initialCategories?: string[];
  initialProducts?: any[];
  initialSearch?: string;
}

export const useProductFilter = ({ 
  initialCategories = [], 
  initialProducts = [],
  initialSearch = ''
}: ProductFilterProps = {}) => {
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [produtos, setProdutos] = useState<any[]>(initialProducts);
  const [filteredProdutos, setFilteredProdutos] = useState<any[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const PRODUCTS_PER_PAGE = 10;

  // Update products when initialProducts changes (from API)
  useEffect(() => {
    setProdutos(initialProducts);
  }, [initialProducts]);

  // Filter products based on search term and filters
  useEffect(() => {
    let filtered = [...produtos];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(produto => 
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(produto => 
        selectedCategories.includes(produto.categoria)
      );
    }
    
    // Filter by stores/lojas
    if (selectedLojas.length > 0) {
      filtered = filtered.filter(produto => 
        selectedLojas.includes(produto.loja_id) ||
        (produto.stores && selectedLojas.includes(produto.stores.id))
      );
    }
    
    // Filter by ratings
    if (selectedRatings.length > 0) {
      filtered = filtered.filter(produto => {
        const rating = parseFloat(produto.avaliacao);
        return selectedRatings.some(r => {
          const minRating = parseFloat(r);
          return !isNaN(minRating) && rating >= minRating;
        });
      });
    }
    
    setFilteredProdutos(filtered);
    setPage(1);
    
    // Reset displayed products
    const initialDisplayed = filtered.slice(0, PRODUCTS_PER_PAGE);
    setDisplayedProducts(initialDisplayed);
    setHasMore(initialDisplayed.length < filtered.length);
    
  }, [produtos, searchTerm, selectedCategories, selectedLojas, selectedRatings]);

  // Extract all available categories from products
  const allCategories: FilterOption[] = Array.from(
    new Set(produtos.map(p => p.categoria).filter(Boolean))
  ).map(cat => ({
    id: cat as string,
    label: cat as string
  }));

  // Rating filter options
  const ratingOptions: FilterOption[] = [
    { id: "4", label: "4+ estrelas" },
    { id: "3", label: "3+ estrelas" },
    { id: "2", label: "2+ estrelas" },
    { id: "1", label: "1+ estrela" }
  ];

  // Handle search input change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // Toggle category filter
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle loja/store filter
  const handleLojaClick = (lojaId: string) => {
    setSelectedLojas(prev => 
      prev.includes(lojaId)
        ? prev.filter(id => id !== lojaId)
        : [...prev, lojaId]
    );
  };

  // Toggle rating filter
  const handleRatingClick = (ratingId: string) => {
    setSelectedRatings(prev => 
      prev.includes(ratingId)
        ? prev.filter(id => id !== ratingId)
        : [...prev, ratingId]
    );
  };

  // Load more products for infinite scroll
  const loadMoreProducts = () => {
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = nextPage * PRODUCTS_PER_PAGE;
    const newProducts = filteredProdutos.slice(startIndex, endIndex);
    
    if (newProducts.length > 0) {
      setDisplayedProducts(prev => [...prev, ...newProducts]);
      setPage(nextPage);
      setHasMore(endIndex < filteredProdutos.length);
    } else {
      setHasMore(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedLojas([]);
    setSelectedRatings([]);
  };

  return {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    allCategories,
    ratingOptions,
    produtos,
    filteredProdutos,
    displayedProducts,
    hasMore,
    page,
    setPage,
    setProdutos,
    setSelectedLojas,
    handleSearchChange,
    handleCategoryClick,
    handleLojaClick,
    handleRatingClick,
    loadMoreProducts,
    clearFilters
  };
};
