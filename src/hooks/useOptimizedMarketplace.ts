
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMarketplaceProducts } from '@/services/marketplaceProductsService';
import { getStores } from '@/services/marketplace/marketplaceService';
import { getProductSegments } from '@/services/admin/productSegmentsService';
import { useDeliveryZones } from './useDeliveryZones';

interface OptimizedMarketplaceData {
  products: any[];
  stores: any[];
  segments: any[];
  isLoading: boolean;
  error: string | null;
  hasDeliveryRestriction: boolean;
  currentDeliveryZone: string | null;
}

export const useOptimizedMarketplace = () => {
  const { currentZones, hasActiveZones, currentCep, isLoading: zonesLoading } = useDeliveryZones();
  
  // IDs dos vendedores que atendem a zona atual
  const availableVendorIds = useMemo(() => {
    return hasActiveZones ? currentZones.map(zone => zone.vendor_id) : undefined;
  }, [currentZones, hasActiveZones]);

  // Consolidate all marketplace data in parallel queries
  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ['marketplace-products', availableVendorIds],
    queryFn: () => getMarketplaceProducts(availableVendorIds),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !zonesLoading, // Só buscar quando as zonas estiverem resolvidas
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

  // Log informações de debug sobre filtros de zona
  useEffect(() => {
    if (hasActiveZones) {
      console.log('[useOptimizedMarketplace] 📍 Filtros de zona ativados:', {
        currentCep,
        zonesCount: currentZones.length,
        vendorsCount: availableVendorIds?.length || 0,
        productsCount: products.length
      });
    }
  }, [hasActiveZones, currentCep, currentZones.length, availableVendorIds?.length, products.length]);

  // Memoize the consolidated data
  const marketplaceData: OptimizedMarketplaceData = useMemo(() => ({
    products,
    stores,
    segments,
    isLoading: zonesLoading || productsLoading || storesLoading || segmentsLoading,
    error: productsError?.message || storesError?.message || null,
    hasDeliveryRestriction: hasActiveZones,
    currentDeliveryZone: currentCep
  }), [products, stores, segments, zonesLoading, productsLoading, storesLoading, segmentsLoading, productsError, storesError, hasActiveZones, currentCep]);

  return marketplaceData;
};
