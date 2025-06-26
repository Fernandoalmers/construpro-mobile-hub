
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
  
  // ESTABILIZADO: IDs dos vendedores com cache inteligente
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

  // OTIMIZADO: Query de produtos com cache melhorado e estável
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
      console.log('[useOptimizedMarketplace] 🔄 Executando query de produtos com filtros:', {
        currentCep,
        availableVendorIds: availableVendorIds?.length || 'all',
        hasDefinedCepWithoutCoverage
      });
      
      if (hasDefinedCepWithoutCoverage) {
        console.log('[useOptimizedMarketplace] 🚫 CEP sem cobertura, retornando array vazio');
        return [];
      }
      
      const result = await getMarketplaceProducts(availableVendorIds);
      console.log('[useOptimizedMarketplace] ✅ Produtos carregados:', result.length);
      return result;
    },
    staleTime: 2 * 60 * 1000, // AUMENTADO: 2 minutos para evitar refetches desnecessários
    gcTime: 5 * 60 * 1000, // AUMENTADO: 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ADICIONADO: Evitar refetch no mount
    enabled: !zonesLoading,
    retry: 1, // REDUZIDO: Menos tentativas
  });

  // ESTABILIZADO: Queries paralelas otimizadas com cache longo
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
    staleTime: 10 * 60 * 1000, // AUMENTADO: 10 minutos
    gcTime: 30 * 60 * 1000, // AUMENTADO: 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ADICIONADO
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
    staleTime: 15 * 60 * 1000, // AUMENTADO: 15 minutos
    gcTime: 60 * 60 * 1000, // AUMENTADO: 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ADICIONADO
    retry: 1,
  });

  const isLoadingData = zonesLoading || productsLoading;

  // ESTABILIZADO: Dados consolidados memoizados sem dependências reativas
  const marketplaceData: OptimizedMarketplaceData = useMemo(() => ({
    products,
    stores: stores || [],
    segments: segments || [],
    isLoading: isLoadingData,
    error: productsError?.message || null,
    hasDeliveryRestriction: hasActiveZones,
    currentDeliveryZone: currentCep,
    isFilteredByZone,
    hasDefinedCepWithoutCoverage
  }), [products, stores, segments, isLoadingData, productsError, hasActiveZones, currentCep, isFilteredByZone, hasDefinedCepWithoutCoverage]);

  return marketplaceData;
};
