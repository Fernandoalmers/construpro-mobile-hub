
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptimizedMarketplace } from '@/hooks/useOptimizedMarketplace';
import { useOptimizedProductFilter } from '@/hooks/useOptimizedProductFilter';
import { useMarketplaceParams } from './useMarketplaceParams';
import { useMarketplaceSegments } from './useMarketplaceSegments';
import { useMarketplaceSearch } from './useMarketplaceSearch';
import { useMarketplaceDataProcessor } from './useMarketplaceDataProcessor';

export const useMarketplaceScreenLogic = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use optimized marketplace data hook
  const { products, stores, segments, isLoading, error } = useOptimizedMarketplace();
  
  // Custom hooks for managing different aspects
  const {
    categoryParam,
    initialCategories,
    selectedSegmentId,
    setSelectedSegmentId,
    selectedSegments,
    setSelectedSegments,
    updateSegmentURL
  } = useMarketplaceParams();
  
  const { segmentOptions } = useMarketplaceSegments();
  const { term, setTerm, handleSubmit } = useMarketplaceSearch();
  
  // Process data with safety checks
  const {
    safeProducts,
    safeStores,
    safeSegments,
    segmentFilteredProducts,
    categories
  } = useMarketplaceDataProcessor({
    products,
    stores,
    segments,
    selectedSegmentId
  });
  
  // Use optimized product filter with safety checks
  const {
    searchTerm,
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    filteredProducts,
    displayedProducts,
    hasMore,
    isLoadingMore,
    actions
  } = useOptimizedProductFilter(segmentFilteredProducts);
  
  // CORRIGIDO: Sync search term with safety check - SEM useEffect para evitar loop
  const syncSearchTerm = useCallback(() => {
    if (actions?.setSearchTerm && searchTerm !== term) {
      actions.setSearchTerm(term || '');
    }
  }, [actions?.setSearchTerm, searchTerm, term]);
  
  // Chamar sync apenas uma vez quando necessário
  useEffect(() => {
    syncSearchTerm();
  }, [syncSearchTerm]);

  // REMOVIDO: useEffect problemático que causava loop infinito (linhas 66-74)
  // O auto-search agora é feito apenas no useMarketplaceSearch
  
  // Static filter options
  const ratingOptions = useMemo(() => [
    { id: "4", label: "4+ estrelas" },
    { id: "3", label: "3+ estrelas" },
    { id: "2", label: "2+ estrelas" },
    { id: "1", label: "1+ estrela" }
  ], []);

  const priceRangeOptions = useMemo(() => [
    { id: "preco-1", label: "Até R$ 50" },
    { id: "preco-2", label: "R$ 50 a R$ 100" },
    { id: "preco-3", label: "R$ 100 a R$ 200" },
    { id: "preco-4", label: "R$ 200 a R$ 500" },
    { id: "preco-5", label: "Acima de R$ 500" }
  ], []);
  
  // Handle segment clicks with safety checks
  const handleSegmentClick = useCallback((segmentId: string) => {
    if (segmentId === "all") {
      setSelectedSegmentId(null);
      setSelectedSegments([]);
      updateSegmentURL(null);
      return;
    }
    
    if (segmentId) {
      setSelectedSegments([segmentId]);
      setSelectedSegmentId(segmentId);
      updateSegmentURL(segmentId);
    }
  }, [setSelectedSegmentId, setSelectedSegments, updateSegmentURL]);
  
  // Handle store clicks with safety checks
  const handleLojaCardClick = useCallback((lojaId: string) => {
    if (lojaId && actions?.setLojas) {
      actions.setLojas([lojaId]);
    }
  }, [actions]);
  
  // Get current display name with safety checks
  const getCurrentDisplayName = useCallback(() => {
    if (selectedSegmentId && Array.isArray(segmentOptions)) {
      const segmentName = segmentOptions.find(s => s?.id === selectedSegmentId)?.label;
      if (segmentName) return segmentName;
    }
    
    if (Array.isArray(selectedCategories) && selectedCategories.length === 1 && Array.isArray(categories)) {
      const categoryName = categories.find(cat => cat?.id === selectedCategories[0])?.label;
      if (categoryName) return categoryName;
    }
    
    return "Todos os Produtos";
  }, [selectedSegmentId, segmentOptions, selectedCategories, categories]);
  
  // CORRIGIDO: Handle search input change sem useEffect adicional
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e?.target?.value || '';
    console.log('[useMarketplaceScreenLogic] ✏️ Search input changed to:', value);
    setTerm(value);
    // REMOVIDO: Não chama handleSubmit aqui para evitar loop
  }, [setTerm]);

  return {
    // State
    headerHeight,
    setHeaderHeight,
    viewType,
    setViewType,
    
    // Data
    safeProducts,
    safeStores,
    safeSegments,
    isLoading,
    error,
    
    // Processed data
    segmentFilteredProducts,
    categories,
    
    // Filter state
    selectedCategories,
    selectedLojas,
    selectedRatings,
    selectedPriceRanges,
    selectedSegmentId,
    selectedSegments,
    
    // Filter options
    ratingOptions,
    priceRangeOptions,
    segmentOptions,
    
    // Filtered results
    filteredProducts,
    displayedProducts,
    hasMore,
    isLoadingMore,
    actions,
    
    // Search
    term,
    handleSearchInputChange,
    handleSubmit,
    
    // Handlers
    handleSegmentClick,
    handleLojaCardClick,
    getCurrentDisplayName
  };
};
