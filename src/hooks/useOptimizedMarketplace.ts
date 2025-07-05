
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
  const { currentZones, hasActiveZones, currentCep, isLoading: zonesLoading, isInitialized: zonesInitialized } = useDeliveryZones();
  const { shouldShowAllProducts, isFilteredByZone, hasDefinedCepWithoutCoverage } = useMarketplaceFilters();
  
  // Aguarda inicialização das zonas antes de prosseguir
  const shouldFetchProducts = zonesInitialized && !zonesLoading;
  
  // IDs dos vendedores com cache inteligente - DEBUG BEABA
  const availableVendorIds = useMemo(() => {
    console.log('[useOptimizedMarketplace] 🔍 BEABA DEBUG - Calculando vendedores disponíveis:', {
      hasDefinedCepWithoutCoverage,
      shouldShowAllProducts,
      currentCep,
      hasActiveZones,
      zonesCount: currentZones.length,
      zoneVendors: currentZones.map(z => z.vendor_id)
    });
    
    if (hasDefinedCepWithoutCoverage) {
      console.log('[useOptimizedMarketplace] 🚫 BEABA DEBUG - CEP sem cobertura, retornando array vazio');
      return [];
    }
    
    if (shouldShowAllProducts || !currentCep) {
      console.log('[useOptimizedMarketplace] 🌍 BEABA DEBUG - Mostrando todos os produtos (sem filtro por zona)');
      return undefined;
    }
    
    if (hasActiveZones && currentZones.length > 0) {
      const vendorIds = currentZones.map(zone => zone.vendor_id);
      console.log('[useOptimizedMarketplace] 🎯 BEABA DEBUG - Filtrando por vendedores das zonas:', vendorIds);
      return vendorIds;
    }
    
    console.log('[useOptimizedMarketplace] ⚠️ BEABA DEBUG - Condição não coberta, retornando undefined');
    return undefined;
  }, [currentZones, hasActiveZones, currentCep, shouldShowAllProducts, hasDefinedCepWithoutCoverage]);

  // Query de produtos otimizada com fallback robusto
  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: [
      'marketplace-products', 
      currentCep || 'all',
      // CORRIGIDO: Usar IDs específicos em vez do length
      availableVendorIds?.length ? availableVendorIds.sort().join(',') : 'all',
      hasDefinedCepWithoutCoverage ? 'no-coverage' : 'with-coverage',
      // NOVO: Adicionar timestamp de inicialização para evitar cache stale
      zonesInitialized ? 'initialized' : 'not-initialized'
    ],
    queryFn: async () => {
      console.log('[useOptimizedMarketplace] 🔄 Carregando produtos com filtros:', {
        currentCep,
        availableVendorIds: availableVendorIds?.length || 'all',
        hasDefinedCepWithoutCoverage,
        zonesInitialized
      });
      
      if (hasDefinedCepWithoutCoverage) {
        console.log('[useOptimizedMarketplace] 🚫 CEP sem cobertura, retornando array vazio');
        return [];
      }
      
      try {
        const result = await getMarketplaceProducts(availableVendorIds);
        console.log('[useOptimizedMarketplace] ✅ Produtos carregados:', result.length);
        
        // NOVO: Validação de integridade específica para Beaba
        const beabaProducts = result.filter(p => 
          p?.store_name?.toLowerCase().includes('beaba') || 
          p?.vendedores?.nome_loja?.toLowerCase().includes('beaba')
        );
        
        if (beabaProducts.length > 0) {
          console.log('[useOptimizedMarketplace] 🔍 BEABA DEBUG - Produtos da Beaba carregados:', beabaProducts.length);
        } else if (availableVendorIds && availableVendorIds.length > 0) {
          console.warn('[useOptimizedMarketplace] ⚠️ BEABA DEBUG - Nenhum produto da Beaba encontrado, mas vendedores filtrados:', availableVendorIds);
        }
        
        return result;
      } catch (error) {
        console.error('[useOptimizedMarketplace] ❌ Erro ao carregar produtos:', error);
        // Retornar array vazio em vez de rejeitar para manter a interface funcional
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // CORRIGIDO: Só buscar quando zonas estão inicializadas E há CEP válido
    enabled: shouldFetchProducts && (zonesInitialized || !currentCep),
    retry: (failureCount, error) => {
      // Retry até 2 vezes, mas não para erros de rede básicos
      if (failureCount >= 2) return false;
      if (error?.message?.includes('timeout')) return true;
      return failureCount < 1;
    },
  });

  // Query de lojas com fallback
  const { 
    data: stores = [], 
    isLoading: storesLoading,
  } = useQuery({
    queryKey: ['marketplace-stores'],
    queryFn: async () => {
      try {
        return await getStores();
      } catch (error) {
        console.warn('[useOptimizedMarketplace] ⚠️ Erro ao carregar lojas, usando fallback:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Query de segmentos com fallback robusto
  const { 
    data: segments = [], 
    isLoading: segmentsLoading 
  } = useQuery({
    queryKey: ['product-segments'],
    queryFn: async () => {
      try {
        const result = await getProductSegments();
        console.log('[useOptimizedMarketplace] ✅ Segmentos carregados:', result.length);
        return result;
      } catch (error) {
        console.warn('[useOptimizedMarketplace] ⚠️ Erro ao carregar segmentos, usando fallback:', error);
        // Retornar segmentos básicos como fallback
        return [
          { id: 'material-construcao', nome: 'Material de Construção', status: 'ativo' },
          { id: 'eletrica', nome: 'Elétrica', status: 'ativo' },
          { id: 'vidracaria', nome: 'Vidraçaria', status: 'ativo' },
          { id: 'marmoraria', nome: 'Marmoraria', status: 'ativo' }
        ];
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // Loading coordenado
  const isLoadingData = zonesLoading || !zonesInitialized || (shouldFetchProducts && productsLoading);

  // Dados consolidados memoizados
  const marketplaceData: OptimizedMarketplaceData = useMemo(() => ({
    products: Array.isArray(products) ? products : [],
    stores: Array.isArray(stores) ? stores : [],
    segments: Array.isArray(segments) ? segments : [],
    isLoading: isLoadingData,
    error: productsError?.message || null,
    hasDeliveryRestriction: hasActiveZones,
    currentDeliveryZone: currentCep,
    isFilteredByZone,
    hasDefinedCepWithoutCoverage
  }), [products, stores, segments, isLoadingData, productsError, hasActiveZones, currentCep, isFilteredByZone, hasDefinedCepWithoutCoverage]);

  return marketplaceData;
};
