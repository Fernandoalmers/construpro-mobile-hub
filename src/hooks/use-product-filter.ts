
import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/services/productService';

interface ProductFilterProps {
  initialProducts: Product[];
  initialCategories?: string[];
  initialLojas?: string[];
  initialRatings?: number[];
  initialSearch?: string;
}

export const useProductFilter = ({
  initialProducts = [],
  initialCategories = [],
  initialLojas = [],
  initialRatings = [],
  initialSearch = ''
}: ProductFilterProps) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedLojas, setSelectedLojas] = useState<string[]>(initialLojas);
  const [selectedRatings, setSelectedRatings] = useState<number[]>(initialRatings);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Update products when initialProducts changes
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  const ratingOptions = [
    { value: 4, label: '4★ ou mais' },
    { value: 3, label: '3★ ou mais' },
    { value: 2, label: '2★ ou mais' },
  ];

  // Filter products based on selected filters
  const filteredProdutos = useMemo(() => {
    return products.filter(produto => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        produto.descricao.toLowerCase().includes(searchTerm.toLowerCase());
        
      // Filter by category
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(produto.categoria);
        
      // Filter by loja
      const matchesLoja = selectedLojas.length === 0 || 
        selectedLojas.includes(produto.loja_id);
        
      // Filter by rating
      const matchesRating = selectedRatings.length === 0 || 
        selectedRatings.some(rating => (produto.avaliacao >= rating));
      
      return matchesSearch && matchesCategory && matchesLoja && matchesRating;
    });
  }, [products, searchTerm, selectedCategories, selectedLojas, selectedRatings]);
  
  // Get paginated products
  const displayedProducts = useMemo(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    return filteredProdutos.slice(startIndex, endIndex);
  }, [filteredProdutos, page, itemsPerPage]);
  
  // Check if more products available
  const hasMore = displayedProducts.length < filteredProdutos.length;
  
  // Load more products
  const loadMoreProducts = () => {
    setPage(prevPage => prevPage + 1);
  };

  // Filter handlers
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };
  
  const handleCategoryClick = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
    setPage(1);
  };
  
  const handleLojaClick = (lojaId: string) => {
    setSelectedLojas(prev => 
      prev.includes(lojaId) 
        ? prev.filter(id => id !== lojaId) 
        : [...prev, lojaId]
    );
    setPage(1);
  };
  
  const handleRatingClick = (rating: number) => {
    setSelectedRatings(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating) 
        : [...prev, rating]
    );
    setPage(1);
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
    products,
    setProducts,
    selectedCategories,
    setSelectedCategories,
    selectedLojas,
    setSelectedLojas,
    selectedRatings,
    setSelectedRatings,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    filteredProdutos,
    displayedProducts,
    hasMore,
    ratingOptions,
    handleSearchChange,
    handleCategoryClick,
    handleLojaClick,
    handleRatingClick,
    loadMoreProducts,
    clearFilters
  };
};
