
import { useState, useEffect, useMemo } from 'react';
import produtos from '../data/produtos.json';
import lojas from '../data/lojas.json';

// Define types
export type FilterOption = {
  id: string;
  label: string;
};

type ProductFilterProps = {
  initialCategories?: string[];
  pageSize?: number;
};

export function useProductFilter({ initialCategories = [], pageSize = 12 }: ProductFilterProps = {}) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  
  // Generate unique categories from all products
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    produtos.forEach(produto => {
      if (produto.categoria) {
        categories.add(produto.categoria);
      }
    });
    return Array.from(categories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, []);
  
  // Rating options
  const ratingOptions = useMemo(() => [
    { id: '4', label: '4+ ⭐' },
    { id: '3', label: '3+ ⭐' },
    { id: '2', label: '2+ ⭐' },
    { id: '1', label: '1+ ⭐' }
  ], []);
  
  // Filter products based on search term and selected filters
  const filteredProdutos = useMemo(() => {
    return produtos.filter(produto => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (produto.descricao && produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        (produto.categoria && selectedCategories.includes(produto.categoria));
      
      // Loja filter
      const matchesLoja = selectedLojas.length === 0 || 
        (produto.lojaId && selectedLojas.includes(produto.lojaId));
      
      // Rating filter
      const matchesRating = selectedRatings.length === 0 || 
        selectedRatings.some(rating => {
          const minRating = parseInt(rating, 10);
          return produto.rating >= minRating;
        });
      
      return matchesSearch && matchesCategory && matchesLoja && matchesRating;
    });
  }, [searchTerm, selectedCategories, selectedLojas, selectedRatings]);
  
  // Calculate total pages and slice products for current page
  const totalPages = Math.ceil(filteredProdutos.length / pageSize);
  const hasMore = page < totalPages;
  
  const displayedProducts = useMemo(() => {
    return filteredProdutos.slice(0, page * pageSize);
  }, [filteredProdutos, page, pageSize]);
  
  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset pagination when search changes
  };
  
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
    setPage(1); // Reset pagination when filters change
  };
  
  const handleLojaClick = (lojaId: string) => {
    setSelectedLojas(prev => 
      prev.includes(lojaId) 
        ? prev.filter(id => id !== lojaId) 
        : [...prev, lojaId]
    );
    setPage(1); // Reset pagination when filters change
  };
  
  const handleRatingClick = (ratingId: string) => {
    setSelectedRatings(prev => 
      prev.includes(ratingId) 
        ? prev.filter(id => id !== ratingId) 
        : [...prev, ratingId]
    );
    setPage(1); // Reset pagination when filters change
  };
  
  const loadMoreProducts = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
    }
  };
  
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
    allCategories,
    ratingOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    handleSearchChange,
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    loadMoreProducts,
    clearFilters,
    setSelectedLojas,
    setPage
  };
}
