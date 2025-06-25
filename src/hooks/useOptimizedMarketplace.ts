
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
  
  // IDs dos vendedores que atendem a zona atual - SIMPLIFICADO para evitar loops
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

  // CORRIGIDO: Query de produtos com configuração otimizada para performance
  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError,
    isFetching: productsRefetching,
    dataUpdatedAt
  } = useQuery({
    queryKey: [
      'marketplace-products', 
      currentCep || 'all', // Usar string estável em vez de null
      availableVendorIds?.length || 'all', // Usar length em vez de serialize
      hasDefinedCepWithoutCoverage ? 'no-coverage' : 'with-coverage'
    ],
    queryFn: async () => {
      console.log('[useOptimizedMarketplace] 🔄 Buscando produtos para CEP:', currentCep);
      console.log('[useOptimizedMarketplace] 📊 Parâmetros da busca:', {
        currentCep,
        vendorIds: availableVendorIds?.length || 'todos',
        hasDefinedCepWithoutCoverage,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Se CEP definido mas sem cobertura, retornar array vazio
        if (hasDefinedCepWithoutCoverage) {
          console.log('[useOptimizedMarketplace] CEP sem cobertura - retornando array vazio');
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
    staleTime: 30000, // 30 segundos - CORRIGIDO: era 0 que causava refetch constante
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    enabled: !zonesLoading, // Só buscar quando as zonas estiverem resolvidas
    retry: 2,
    // REMOVIDO: refetchOnMount: true que causava refetch desnecessário
  });

  // Queries paralelas com configuração otimizada
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

  // REMOVIDO: useEffect problemático que causava loop infinito (linhas 140-155)
  // A invalidação agora é feita apenas quando necessário no useDeliveryZones

  // Loading inclui refetching para mostrar estado de carregamento durante mudanças de CEP
  const isLoadingData = zonesLoading || productsLoading || storesLoading || segmentsLoading || productsRefetching;

  // Memoize the consolidated data
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
