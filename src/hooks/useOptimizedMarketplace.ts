
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const { currentZones, hasActiveZones, currentCep, isLoading: zonesLoading } = useDeliveryZones();
  const { shouldShowAllProducts, isFilteredByZone, hasDefinedCepWithoutCoverage } = useMarketplaceFilters();
  
  // IDs dos vendedores que atendem a zona atual
  const availableVendorIds = useMemo(() => {
    // Se CEP definido mas sem cobertura, retornar array vazio para não mostrar produtos
    if (hasDefinedCepWithoutCoverage) {
      console.log('[useOptimizedMarketplace] 🚫 CEP sem cobertura - não exibindo produtos');
      return [];
    }
    
    // Se deve mostrar todos os produtos OU não há CEP definido, não filtrar
    if (shouldShowAllProducts || !currentCep) {
      console.log('[useOptimizedMarketplace] 🌍 Mostrando todos os produtos');
      return undefined; // undefined = sem filtro, todos os produtos
    }
    
    // Se há zonas ativas, filtrar por elas
    if (hasActiveZones && currentZones.length > 0) {
      const vendorIds = currentZones.map(zone => zone.vendor_id);
      console.log('[useOptimizedMarketplace] 📍 Filtros de zona ativos:', {
        zonesCount: currentZones.length,
        vendorIds: vendorIds.length,
        currentCep
      });
      return vendorIds;
    }
    
    // Fallback: não filtrar
    return undefined;
  }, [currentZones, hasActiveZones, currentCep, shouldShowAllProducts, hasDefinedCepWithoutCoverage]);

  // Query de produtos com tratamento de erro melhorado
  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ['marketplace-products', availableVendorIds, shouldShowAllProducts, hasDefinedCepWithoutCoverage],
    queryFn: async () => {
      try {
        // Se CEP definido mas sem cobertura, retornar array vazio
        if (hasDefinedCepWithoutCoverage) {
          console.log('[useOptimizedMarketplace] CEP sem cobertura - retornando array vazio');
          return [];
        }
        
        return await getMarketplaceProducts(availableVendorIds);
      } catch (error) {
        console.error('[useOptimizedMarketplace] Erro ao carregar produtos:', error);
        // Retornar array vazio em vez de falhar
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !zonesLoading, // Só buscar quando as zonas estiverem resolvidas
    retry: 1, // Tentar apenas uma vez em caso de erro
  });

  // Queries paralelas com tratamento de erro
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
        console.warn('[useOptimizedMarketplace] Erro ao carregar lojas:', error);
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
        console.warn('[useOptimizedMarketplace] Erro ao carregar segmentos:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Log informações de debug sobre filtros de zona
  useEffect(() => {
    if (!zonesLoading) {
      console.log('[useOptimizedMarketplace] 📊 Estado atual do marketplace:', {
        hasActiveZones,
        currentCep,
        zonesCount: currentZones.length,
        vendorsCount: availableVendorIds?.length || 'todos',
        productsCount: products.length,
        isFilteredByZone,
        shouldShowAllProducts,
        hasDefinedCepWithoutCoverage
      });
    }
  }, [hasActiveZones, currentCep, currentZones.length, availableVendorIds?.length, products.length, zonesLoading, isFilteredByZone, shouldShowAllProducts, hasDefinedCepWithoutCoverage]);

  // Memoize the consolidated data
  const marketplaceData: OptimizedMarketplaceData = useMemo(() => ({
    products,
    stores,
    segments,
    isLoading: zonesLoading || productsLoading || storesLoading || segmentsLoading,
    error: productsError?.message || storesError?.message || null,
    hasDeliveryRestriction: hasActiveZones,
    currentDeliveryZone: currentCep,
    isFilteredByZone,
    hasDefinedCepWithoutCoverage
  }), [products, stores, segments, zonesLoading, productsLoading, storesLoading, segmentsLoading, productsError, storesError, hasActiveZones, currentCep, isFilteredByZone, hasDefinedCepWithoutCoverage]);

  return marketplaceData;
};
