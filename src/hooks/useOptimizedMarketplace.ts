
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMarketplaceProducts } from '@/services/marketplaceProductsService';
import { getStores } from '@/services/marketplace/marketplaceService';
import { getProductSegments } from '@/services/admin/productSegmentsService';

interface OptimizedMarketplaceData {
  products: any[];
  stores: any[];
  segments: any[];
  isLoading: boolean;
  error: string | null;
}

export const useOptimizedMarketplace = () => {
  // Consolidate all marketplace data in parallel queries
  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: getMarketplaceProducts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { 
    data: stores = [], 
    isLoading: storesLoading,
    error: storesError 
  } = useQuery({
    queryKey: ['marketplace-stores'],
    queryFn: getStores,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { 
    data: segments = [], 
    isLoading: segmentsLoading 
  } = useQuery({
    queryKey: ['product-segments'],
    queryFn: getProductSegments,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Memoize the consolidated data
  const marketplaceData: OptimizedMarketplaceData = useMemo(() => ({
    products,
    stores,
    segments,
    isLoading: productsLoading || storesLoading || segmentsLoading,
    error: productsError?.message || storesError?.message || null
  }), [products, stores, segments, productsLoading, storesLoading, segmentsLoading, productsError, storesError]);

  return marketplaceData;
};
