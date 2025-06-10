
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useOptimizedMarketplace } from '@/hooks/useOptimizedMarketplace';
import { useMarketplaceParams } from './useMarketplaceParams';
import { useMarketplaceSegments } from './useMarketplaceSegments';
import { useMarketplaceSearch } from './useMarketplaceSearch';

export const useMarketplaceState = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  // Use optimized marketplace data hook with safety checks
  const { products, stores, segments, isLoading, error } = useOptimizedMarketplace();
  
  // Ensure data safety with default values
  const safeProducts = Array.isArray(products) ? products : [];
  const safeStores = Array.isArray(stores) ? stores : [];
  
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
  
  // Filter products by selected segment with safety checks
  const segmentFilteredProducts = useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[MarketplaceState] No segment filter - returning all products:', safeProducts.length);
      return safeProducts;
    }
    
    const filtered = safeProducts.filter(product => 
      product?.segmento_id === selectedSegmentId
    );
    
    console.log('[MarketplaceState] Segment filtered products:', filtered.length, 'from', safeProducts.length);
    return filtered;
  }, [safeProducts, selectedSegmentId]);
  
  // Extract all categories from products with safety checks
  const categories = useMemo(() => {
    if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
      return [];
    }
    
    const uniqueCategories = new Set(
      safeProducts
        .filter(product => product?.categoria)
        .map(product => product.categoria)
    );
    
    return Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, [safeProducts]);

  return {
    // State
    headerHeight,
    setHeaderHeight,
    viewType,
    setViewType,
    
    // Navigation
    location,
    navigate,
    searchParams,
    
    // Data
    safeProducts,
    safeStores,
    segments,
    isLoading,
    error,
    
    // Params and segments
    categoryParam,
    initialCategories,
    selectedSegmentId,
    setSelectedSegmentId,
    selectedSegments,
    setSelectedSegments,
    updateSegmentURL,
    segmentOptions,
    
    // Search
    term,
    setTerm,
    handleSubmit,
    
    // Processed data
    segmentFilteredProducts,
    categories
  };
};
