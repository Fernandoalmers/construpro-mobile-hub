
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
  
  // IDs dos vendedores que atendem a zona atual - SIMPLIFICADO
  const availableVendorIds = useMemo(() => {
    // Se CEP definido mas sem cobertura, retornar array vazio
    if (hasDefinedCepWithoutCoverage) {
      console.log('[useOptimizedMarketplace] 🚫 CEP sem cobertura - não exibindo produtos');
      return [];
    }
    
    // Se deve mostrar todos os produtos OU não há CEP definido, não filtrar
    if (shouldShowAllProducts || !currentCep) {
      return undefined; // undefined = sem filtro, todos os produtos
    }
    
    // Se há zonas ativas, filtrar por elas
    if (hasActiveZones && currentZones.length > 0) {
      const vendorIds = currentZones.map(zone => zone.vendor_id);
      console.log('[useOptimizedMarketplace] 📍 Filtros ativos:', {
        zonas: currentZones.length,
        vendedores: vendorIds.length,
        cep: currentCep
      });
      return vendorIds;
    }
    
    return undefined;
  }, [currentZones, hasActiveZones, currentCep, shouldShowAllProducts, hasDefinedCepWithoutCoverage]);

  // Query de produtos com configuração otimizada
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
      console.log('[useOptimizedMarketplace] 🔄 Buscando produtos...');
      
      try {
        // Se CEP definido mas sem cobertura, retornar array vazio
        if (hasDefinedCepWithoutCoverage) {
          console.log('[useOptimizedMarketplace] CEP sem cobertura - array vazio');
          return [];
        }
        
        const result = await getMarketplaceProducts(availableVendorIds);
        console.log('[useOptimizedMarketplace] ✅ Produtos carregados:', result.length);
        return result;
      } catch (error) {
        console.error('[useOptimizedMarketplace] ❌ Erro ao carregar produtos:', error);
        return [];
      }
    },
    staleTime: 30000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos  
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

  const isLoadingData = zonesLoading || productsLoading || storesLoading || segmentsLoading || productsRefetching;

  // Dados consolidados memoizados
  const marketplaceData: OptimizedMarketplaceData = useMemo(() => ({
    products,
    stores,
    segments,
    isLoading: isLoadingData,
    error: productsError?.message || storesError?.message || null,
    hasDeliveryRestriction: hasActiveZones,
    currentDeliveryZone: currentCep,
    isFilteredByZone,
    hasDefinedCepWithoutCoverage
  }), [products, stores, segments, isLoadingData, productsError, storesError, hasActiveZones, currentCep, isFilteredByZone, hasDefinedCepWithoutCoverage]);

  return marketplaceData;
};
