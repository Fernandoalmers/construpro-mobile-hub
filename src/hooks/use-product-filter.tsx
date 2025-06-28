
import { useState, useEffect, useCallback, useMemo } from 'react';

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
  // Remove searchTerm state - will use external search term
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [produtos, setProdutos] = useState<any[]>(initialProducts);
  const [filteredProdutos, setFilteredProdutos] = useState<any[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [externalSearchTerm, setExternalSearchTerm] = useState<string>(initialSearch);
  const PRODUCTS_PER_PAGE = 10;

  // Update products when initialProducts changes (from API)
  useEffect(() => {
    console.log('[useProductFilter] Updating produtos with:', initialProducts.length, 'items');
    setProdutos(initialProducts);
  }, [initialProducts]);

  // Helper function to check if product price is in selected range
  const isPriceInRange = useCallback((preco: number, rangeId: string): boolean => {
    switch (rangeId) {
      case 'preco-1': return preco <= 50;
      case 'preco-2': return preco > 50 && preco <= 100;
      case 'preco-3': return preco > 100 && preco <= 200;
      case 'preco-4': return preco > 200 && preco <= 500;
      case 'preco-5': return preco > 500;
      default: return false;
    }
  }, []);

  // Memoize filtered products using external search term - FIXED TO SEARCH ONLY IN NAME AND DESCRIPTION
  const filteredProductsMemo = useMemo(() => {
    console.log('[useProductFilter] Recalculating filtered products with search term:', externalSearchTerm);
    let filtered = [...produtos];
    
    // Filter by external search term (ONLY search in product name and description)
    if (externalSearchTerm && externalSearchTerm.trim()) {
      const searchTerm = externalSearchTerm.toLowerCase();
      filtered = filtered.filter(produto => {
        const nameMatch = produto.nome?.toLowerCase().includes(searchTerm);
        const descriptionMatch = produto.descricao?.toLowerCase().includes(searchTerm);
        
        console.log('[useProductFilter] Product:', produto.nome, 'Name match:', nameMatch, 'Description match:', descriptionMatch);
        
        // ONLY search in name and description, NOT in categories
        return nameMatch || descriptionMatch;
      });
      console.log('[useProductFilter] After search filter:', filtered.length, 'products');
    }
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(produto => 
        selectedCategories.includes(produto.categoria)
      );
    }
    
    // Filter by stores/lojas
    if (selectedLojas.length > 0) {
      filtered = filtered.filter(produto => {
        const storeId = produto.loja_id || 
                       produto.vendedor_id || 
                       produto.stores?.id ||
                       (produto.vendedores && produto.vendedores.id);
        return selectedLojas.includes(storeId);
      });
    }
    
    // Filter by price ranges
    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter(produto => {
        const preco = produto.preco_normal || produto.preco || 0;
        return selectedPriceRanges.some(rangeId => isPriceInRange(preco, rangeId));
      });
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
    
    console.log('[useProductFilter] Final filtered products:', filtered.length);
    return filtered;
  }, [produtos, externalSearchTerm, selectedCategories, selectedLojas, selectedRatings, selectedPriceRanges, isPriceInRange]);

  // Update filtered products when memo changes
  useEffect(() => {
    setFilteredProdutos(filteredProductsMemo);
    setPage(1);
    
    // Reset displayed products
    const initialDisplayed = filteredProductsMemo.slice(0, PRODUCTS_PER_PAGE);
    setDisplayedProducts(initialDisplayed);
    setHasMore(initialDisplayed.length < filteredProductsMemo.length);
    setIsLoadingMore(false);
  }, [filteredProductsMemo]);

  // Extract all available categories from products
  const allCategories: FilterOption[] = useMemo(() => 
    Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean)))
      .map(cat => ({ id: cat as string, label: cat as string })),
    [produtos]
  );

  // Static filter options
  const ratingOptions: FilterOption[] = useMemo(() => [
    { id: "4", label: "4+ estrelas" },
    { id: "3", label: "3+ estrelas" },
    { id: "2", label: "2+ estrelas" },
    { id: "1", label: "1+ estrela" }
  ], []);

  const priceRangeOptions: FilterOption[] = useMemo(() => [
    { id: "preco-1", label: "Até R$ 50" },
    { id: "preco-2", label: "R$ 50 a R$ 100" },
    { id: "preco-3", label: "R$ 100 a R$ 200" },
    { id: "preco-4", label: "R$ 200 a R$ 500" },
    { id: "preco-5", label: "Acima de R$ 500" }
  ], []);

  // Handle search input change - now updates external search term
  const handleSearchChange = useCallback((term: string) => {
    console.log('[useProductFilter] External search term updated to:', term);
    setExternalSearchTerm(term);
  }, []);

  // Toggle category filter
  const handleCategoryClick = useCallback((categoryId: string) => {
    console.log('[useProductFilter] Category clicked:', categoryId);
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  // Toggle loja/store filter
  const handleLojaClick = useCallback((lojaId: string) => {
    console.log('[useProductFilter] Loja clicked:', lojaId);
    setSelectedLojas(prev => 
      prev.includes(lojaId)
        ? prev.filter(id => id !== lojaId)
        : [...prev, lojaId]
    );
  }, []);

  // Toggle price range filter
  const handlePriceRangeClick = useCallback((rangeId: string) => {
    console.log('[useProductFilter] Price range clicked:', rangeId);
    setSelectedPriceRanges(prev => 
      prev.includes(rangeId)
        ? prev.filter(id => id !== rangeId)
        : [...prev, rangeId]
    );
  }, []);

  // Toggle rating filter
  const handleRatingClick = useCallback((ratingId: string) => {
    console.log('[useProductFilter] Rating clicked:', ratingId);
    setSelectedRatings(prev => 
      prev.includes(ratingId)
        ? prev.filter(id => id !== ratingId)
        : [...prev, ratingId]
    );
  }, []);

  // Load more products for infinite scroll - OPTIMIZED
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || !hasMore) {
      console.log('[useProductFilter] Skipping load more - loading:', isLoadingMore, 'hasMore:', hasMore);
      return;
    }

    console.log('[useProductFilter] Loading more products...');
    setIsLoadingMore(true);
    
    // Use setTimeout to prevent blocking
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * PRODUCTS_PER_PAGE;
      const endIndex = nextPage * PRODUCTS_PER_PAGE;
      const newProducts = filteredProdutos.slice(startIndex, endIndex);
      
      if (newProducts.length > 0) {
        setDisplayedProducts(prev => [...prev, ...newProducts]);
        setPage(nextPage);
        setHasMore(endIndex < filteredProdutos.length);
        console.log('[useProductFilter] Added', newProducts.length, 'more products');
      } else {
        setHasMore(false);
        console.log('[useProductFilter] No more products to load');
      }
      
      setIsLoadingMore(false);
    }, 100);
  }, [page, filteredProdutos, hasMore, isLoadingMore]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    console.log('[useProductFilter] Clearing all filters');
    setExternalSearchTerm("");
    setSelectedCategories([]);
    setSelectedLojas([]);
    setSelectedRatings([]);
    setSelectedPriceRanges([]);
  }, []);

  return {
    searchTerm: externalSearchTerm, // Return current search term
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
    isLoadingMore,
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
