
import { useState, useEffect } from 'react';
import produtos from '../data/produtos.json';

export interface FilterOption {
  id: string;
  label: string;
}

export interface UseProductFilterProps {
  initialCategories?: string[];
}

export function useProductFilter({ initialCategories = [] }: UseProductFilterProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState<typeof produtos>([]);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 8;

  // Extract unique categories from products
  const allCategories = Array.from(new Set(produtos.map(produto => produto.categoria)))
    .map(category => ({
      id: category,
      label: category
    }));

  // Ratings filter options
  const ratingOptions: FilterOption[] = [
    { id: '4', label: '4★ ou mais' },
    { id: '3', label: '3★ ou mais' },
    { id: '2', label: '2★ ou mais' },
  ];
  
  // Volume/Unit filter options
  const volumeOptions: FilterOption[] = [
    { id: 'litro', label: 'Litros' },
    { id: 'm2', label: 'Metro²' },
    { id: 'unidade', label: 'Unidade' },
    { id: 'pequeno', label: 'Pequeno' },
    { id: 'grande', label: 'Grande' },
  ];

  // Filter products based on search term and filters
  const filteredProdutos = produtos.filter(produto => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(produto.categoria);
    
    // Loja filter
    const matchesLoja = selectedLojas.length === 0 || 
      selectedLojas.includes(produto.lojaId);
    
    // Rating filter (basic simulation for demonstration)
    const matchesRating = selectedRatings.length === 0 || 
      selectedRatings.some(rating => {
        const minRating = parseInt(rating);
        return produto.avaliacao >= minRating;
      });
    
    // Volume filter (simplified)
    const matchesVolume = selectedVolumes.length === 0;
    
    return matchesSearch && matchesCategory && matchesLoja && matchesRating && matchesVolume;
  });

  // Initial load and pagination
  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    
    setDisplayedProducts(filteredProdutos.slice(0, endIndex));
    setHasMore(endIndex < filteredProdutos.length);
  }, [filteredProdutos, page]);

  const loadMoreProducts = () => {
    setPage(prev => prev + 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset pagination when search changes
  };

  const handleLojaClick = (lojaId: string) => {
    // Toggle selection
    if (selectedLojas.includes(lojaId)) {
      setSelectedLojas(selectedLojas.filter(id => id !== lojaId));
    } else {
      setSelectedLojas([...selectedLojas, lojaId]);
    }
    setPage(1); // Reset pagination
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
    setPage(1);
  };

  const handleRatingClick = (ratingId: string) => {
    if (selectedRatings.includes(ratingId)) {
      setSelectedRatings(selectedRatings.filter(id => id !== ratingId));
    } else {
      setSelectedRatings([ratingId]);
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedLojas([]);
    setSelectedRatings([]);
    setSelectedVolumes([]);
    setSearchTerm('');
    setPage(1);
  };

  return {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedVolumes,
    allCategories,
    ratingOptions,
    volumeOptions,
    filteredProdutos,
    displayedProducts,
    hasMore,
    page,
    setSearchTerm,
    setSelectedCategories,
    setSelectedLojas,
    setSelectedRatings,
    setSelectedVolumes,
    loadMoreProducts,
    handleSearchChange,
    handleLojaClick,
    handleCategoryClick,
    handleRatingClick,
    clearFilters
  };
}
