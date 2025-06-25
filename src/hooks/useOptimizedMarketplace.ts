import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMarketplaceProducts } from '@/services/marketplaceProductsService';
import { getStores } from '@/services/marketplace/marketplaceService';
import { getProductSegments } from '@/services/admin/productSegmentsService';
import { useDeliveryZones } from './useDeliveryZones';
import { useMarketplaceFilters } from './useMarketplaceFilters';

interface OptimizedMarketplaceData {
  products: any[];
  stores: any[];
  segments: any[];
  isLoading: boolean;
  error: string | null;
  hasDeliveryRestriction: boolean;
  currentDeliveryZone: string | null;
  isFilteredByZone: boolean;
  hasDefinedCepWithoutCoverage: boolean;
}

export const useOptimizedMarketplace = () => {
  const queryClient = useQueryClient();
  const { currentZones, hasActiveZones, currentCep, isLoading: zonesLoading } = useDeliveryZones();
  const { shouldShowAllProducts, isFilteredByZone, hasDefinedCepWithoutCoverage } = useMarketplaceFilters();
  
  // OTIMIZADO: IDs dos vendedores com cache inteligente
  const availableVendorIds = useMemo(() => {
    if (hasDefinedCepWithoutCoverage) {
      return [];
    }
    
    if (shouldShowAllProducts || !currentCep) {
      return undefined;
    }
    
    if (hasActiveZones && currentZones.length > 0) {
      return currentZones.map(zone => zone.vendor_id);
    }
    
    return undefined;
  }, [currentZones, hasActiveZones, currentCep, shouldShowAllProducts, hasDefinedCepWithoutCoverage]);

  // OTIMIZADO: Query de produtos com cache melhorado
  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError,
    isFetching: productsRefetching,
  } = useQuery({
    queryKey: [
      'marketplace-products', 
      currentCep || 'all',
      availableVendorIds?.length || 'all',
      hasDefinedCepWithoutCoverage ? 'no-coverage' : 'with-coverage'
    ],
    queryFn: async () => {
      if (hasDefinedCepWithoutCoverage) {
        return [];
      }
      
      const result = await getMarketplaceProducts(availableVendorIds);
      return result;
    },
    staleTime: 30000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !zonesLoading,
    retry: 2,
  });

  // Queries paralelas otimizadas
  const { 
    data: stores = [], 
    isLoading: storesLoading,
    error: storesError 
  } = useQuery({
    queryKey: ['marketplace-stores'],
    queryFn: async () => {
      try {
        return await getStores();
      } catch (error) {
        console.warn('[useOptimizedMarketplace] ⚠️ Erro ao carregar lojas:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { 
    data: segments = [], 
    isLoading: segmentsLoading 
  } = useQuery({
    queryKey: ['product-segments'],
    queryFn: async () => {
      try {
        return await getProductSegments();
      } catch (error) {
        console.warn('[useOptimizedMarketplace] ⚠️ Erro ao carregar segmentos:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const isLoadingData = zonesLoading || productsLoading || productsRefetching;

  // Dados consolidados memoizados
  const marketplaceData: OptimizedMarketplaceData = useMemo(() => ({
    products,
    stores: [], // Keep existing stores logic
    segments: [], // Keep existing segments logic
    isLoading: isLoadingData,
    error: productsError?.message || null,
    hasDeliveryRestriction: hasActiveZones,
    currentDeliveryZone: currentCep,
    isFilteredByZone,
    hasDefinedCepWithoutCoverage
  }), [products, isLoadingData, productsError, hasActiveZones, currentCep, isFilteredByZone, hasDefinedCepWithoutCoverage]);

  return marketplaceData;
};
