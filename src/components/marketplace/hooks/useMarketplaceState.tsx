
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductFilter } from '@/hooks/use-product-filter';
import { useOptimizedMarketplace } from '@/hooks/useOptimizedMarketplace';
import { useMarketplaceParams } from './useMarketplaceParams';
import { useMarketplaceSegments } from './useMarketplaceSegments';
import { useMarketplaceSearch } from './useMarketplaceSearch';
import { useSegmentFix } from '@/hooks/useSegmentFix';

export const useMarketplaceState = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  // Use optimized marketplace data hook with safety checks
  const { products, stores, segments, isLoading, error } = useOptimizedMarketplace();
  
  // Auto-fix product segments
  useSegmentFix();
  
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
  
  // CORRECTED: Filter products by selected segment with proper null segmento_id handling
  const segmentFilteredProducts = useMemo(() => {
    console.log('[MarketplaceState] Starting segment filtering with selecte segmentId:', selectedSegmentId);
    
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[MarketplaceState] No segment filter - returning ALL products (including those without segmento_id):', safeProducts.length);
      
      // Log breakdown for debugging
      const withSegment = safeProducts.filter(p => p?.segmento_id);
      const withoutSegment = safeProducts.filter(p => !p?.segmento_id);
      console.log(`[MarketplaceState] Breakdown - With segment: ${withSegment.length}, Without segment: ${withoutSegment.length}`);
      
      return safeProducts;
    }
    
    const filtered = safeProducts.filter(product => {
      if (!product) return false;
      
      // Direct match by segment ID
      return product.segmento_id === selectedSegmentId;
    });
    
    console.log('[MarketplaceState] Segment filtered products:', filtered.length, 'from', safeProducts.length);
    
    // Debug empty results
    if (filtered.length === 0 && safeProducts.length > 0) {
      console.warn('[MarketplaceState] ⚠️ No products matched segment filter!');
      console.warn('Requested segment ID:', selectedSegmentId);
      console.warn('Available segment IDs:', [...new Set(safeProducts.map(p => p?.segmento_id))]);
    }
    
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

  // Debug logging for TRINCHA ATLAS specifically
  useEffect(() => {
    const trinchaInOriginal = safeProducts.find(p => p?.nome?.includes('TRINCHA ATLAS'));
    const trinchaInFiltered = segmentFilteredProducts.find(p => p?.nome?.includes('TRINCHA ATLAS'));
    
    if (trinchaInOriginal && !trinchaInFiltered && !selectedSegmentId) {
      console.error('[MarketplaceState] 🚨 TRINCHA ATLAS found in original but missing in filtered when showing "all"!');
      console.error('Original product:', trinchaInOriginal);
    }
  }, [safeProducts, segmentFilteredProducts, selectedSegmentId]);

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
