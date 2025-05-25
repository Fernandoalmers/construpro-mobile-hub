
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
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [produtos, setProdutos] = useState<any[]>(initialProducts);
  const [filteredProdutos, setFilteredProdutos] = useState<any[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const PRODUCTS_PER_PAGE = 10;

  // Update products when initialProducts changes (from API)
  useEffect(() => {
    console.log('[useProductFilter] Updating produtos with:', initialProducts.length, 'items');
    setProdutos(initialProducts);
  }, [initialProducts]);

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

  // Filter products based on search term and filters
  useEffect(() => {
    console.log('[useProductFilter] Filtering products...');
    console.log('[useProductFilter] Selected categories:', selectedCategories);
    console.log('[useProductFilter] Selected lojas:', selectedLojas);
    console.log('[useProductFilter] Selected price ranges:', selectedPriceRanges);
    console.log('[useProductFilter] Total products to filter:', produtos.length);
    
    let filtered = [...produtos];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(produto => 
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('[useProductFilter] After search filter:', filtered.length);
    }
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(produto => 
        selectedCategories.includes(produto.categoria)
      );
      console.log('[useProductFilter] After category filter:', filtered.length);
    }
    
    // Filter by stores/lojas - improved logic
    if (selectedLojas.length > 0) {
      filtered = filtered.filter(produto => {
        // Check different possible store ID fields
        const storeId = produto.loja_id || 
                       produto.vendedor_id || 
                       produto.stores?.id ||
                       (produto.vendedores && produto.vendedores.id);
        
        const isMatch = selectedLojas.includes(storeId);
        console.log(`[useProductFilter] Product ${produto.nome} - Store ID: ${storeId}, Match: ${isMatch}`);
        return isMatch;
      });
      console.log('[useProductFilter] After store filter:', filtered.length);
    }
    
    // Filter by price ranges
    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter(produto => {
        const preco = produto.preco_normal || produto.preco || 0;
        return selectedPriceRanges.some(rangeId => isPriceInRange(preco, rangeId));
      });
      console.log('[useProductFilter] After price filter:', filtered.length);
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
      console.log('[useProductFilter] After rating filter:', filtered.length);
    }
    
    console.log('[useProductFilter] Final filtered products:', filtered.length);
    setFilteredProdutos(filtered);
    setPage(1);
    
    // Reset displayed products
    const initialDisplayed = filtered.slice(0, PRODUCTS_PER_PAGE);
    setDisplayedProducts(initialDisplayed);
    setHasMore(initialDisplayed.length < filtered.length);
    
  }, [produtos, searchTerm, selectedCategories, selectedLojas, selectedRatings, selectedPriceRanges]);

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

  // Price range options
  const priceRangeOptions: FilterOption[] = [
    { id: "preco-1", label: "Até R$ 50" },
    { id: "preco-2", label: "R$ 50 a R$ 100" },
    { id: "preco-3", label: "R$ 100 a R$ 200" },
    { id: "preco-4", label: "R$ 200 a R$ 500" },
    { id: "preco-5", label: "Acima de R$ 500" }
  ];

  // Handle search input change
  const handleSearchChange = (term: string) => {
    console.log('[useProductFilter] Search term changed to:', term);
    setSearchTerm(term);
  };

  // Toggle category filter
  const handleCategoryClick = (categoryId: string) => {
    console.log('[useProductFilter] Category clicked:', categoryId);
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle loja/store filter - REACTIVATED
  const handleLojaClick = (lojaId: string) => {
    console.log('[useProductFilter] Loja clicked:', lojaId);
    setSelectedLojas(prev => 
      prev.includes(lojaId)
        ? prev.filter(id => id !== lojaId)
        : [...prev, lojaId]
    );
  };

  // Toggle price range filter - NEW IMPLEMENTATION
  const handlePriceRangeClick = (rangeId: string) => {
    console.log('[useProductFilter] Price range clicked:', rangeId);
    setSelectedPriceRanges(prev => 
      prev.includes(rangeId)
        ? prev.filter(id => id !== rangeId)
        : [...prev, rangeId]
    );
  };

  // Toggle rating filter
  const handleRatingClick = (ratingId: string) => {
    console.log('[useProductFilter] Rating clicked:', ratingId);
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
    console.log('[useProductFilter] Clearing all filters');
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedLojas([]);
    setSelectedRatings([]);
    setSelectedPriceRanges([]);
  };

  return {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    allCategories,
    ratingOptions,
    priceRangeOptions,
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
    handlePriceRangeClick,
    handleRatingClick,
    loadMoreProducts,
    clearFilters
  };
};
