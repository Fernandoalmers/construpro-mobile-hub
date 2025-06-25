
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
    if (!hasActiveZones || currentZones.length === 0) {
      console.log('[useOptimizedMarketplace] 🌍 Sem filtros de zona - todos os produtos disponíveis');
      return undefined; // undefined = sem filtro, todos os produtos
    }
    
    const vendorIds = currentZones.map(zone => zone.vendor_id);
    console.log('[useOptimizedMarketplace] 📍 Filtros de zona ativos:', {
      zonesCount: currentZones.length,
      vendorIds: vendorIds.length,
      currentCep
    });
    
    return vendorIds;
  }, [currentZones, hasActiveZones, currentCep]);

  // Query de produtos com tratamento de erro melhorado
  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError 
  } = useQuery({
    queryKey: ['marketplace-products', availableVendorIds],
    queryFn: async () => {
      try {
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
        isFiltered: hasActiveZones
      });
    }
  }, [hasActiveZones, currentCep, currentZones.length, availableVendorIds?.length, products.length, zonesLoading]);

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
