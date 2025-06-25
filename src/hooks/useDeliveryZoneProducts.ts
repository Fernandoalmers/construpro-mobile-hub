
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeliveryZones } from './useDeliveryZones';
import type { MarketplaceProduct } from '@/services/marketplaceProductsService';

interface UseDeliveryZoneProductsReturn {
  products: MarketplaceProduct[];
  isLoading: boolean;
  error: string | null;
  hasDeliveryRestriction: boolean;
  availableVendors: string[];
  totalProducts: number;
  refetch: () => void;
}

export const useDeliveryZoneProducts = (): UseDeliveryZoneProductsReturn => {
  const { currentZones, hasActiveZones, isLoading: zonesLoading } = useDeliveryZones();
  
  // IDs dos vendedores que atendem a zona atual
  const availableVendorIds = useMemo(() => {
    return hasActiveZones ? currentZones.map(zone => zone.vendor_id) : [];
  }, [currentZones, hasActiveZones]);

  const { 
    data: products = [], 
    isLoading: productsLoading,
    error: productsError,
    refetch
  } = useQuery({
    queryKey: ['marketplace-products-by-zone', availableVendorIds],
    queryFn: async () => {
      console.log('[useDeliveryZoneProducts] Carregando produtos por zona');
      
      // Query base para produtos aprovados
      let query = supabase
        .from('produtos')
        .select(`
          *,
          vendedores:vendedor_id (
            id,
            nome_loja,
            logo,
            telefone,
            email
          )
        `)
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });

      // Se há zonas ativas, filtrar por vendedores da zona
      if (hasActiveZones && availableVendorIds.length > 0) {
        query = query.in('vendedor_id', availableVendorIds);
        console.log('[useDeliveryZoneProducts] Filtrando por vendedores da zona:', availableVendorIds.length);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[useDeliveryZoneProducts] Erro ao carregar produtos:', error);
        throw new Error(error.message);
      }

      // Processar produtos similar ao marketplaceProductsService
      const processedProducts: MarketplaceProduct[] = (data || []).map(product => {
        const vendedorData = product.vendedores;
        let storeInfo;
        
        if (vendedorData && typeof vendedorData === 'object') {
          storeInfo = {
            id: product.vendedor_id,
            nome: vendedorData.nome_loja || 'Loja sem nome',
            nome_loja: vendedorData.nome_loja || 'Loja sem nome',
            logo_url: vendedorData.logo || ''
          };
        }
        
        // Processar imagens
        let processedImages: string[] = [];
        if (product.imagens) {
          if (Array.isArray(product.imagens)) {
            processedImages = product.imagens.filter(img => typeof img === 'string');
          } else if (typeof product.imagens === 'string') {
            try {
              const parsed = JSON.parse(product.imagens);
              if (Array.isArray(parsed)) {
                processedImages = parsed.filter(img => typeof img === 'string');
              }
            } catch (e) {
              processedImages = [product.imagens];
            }
          }
        }

        return {
          id: product.id,
          nome: product.nome,
          descricao: product.descricao,
          categoria: product.categoria,
          preco_original: product.preco_normal, // Use preco_normal from database
          preco_promocional: product.preco_promocional,
          promocao_ativa: product.promocao_ativa || false,
          promocao_inicio: product.promocao_inicio,
          promocao_fim: product.promocao_fim,
          estoque: product.estoque,
          imagens: processedImages,
          status: product.status as 'pendente' | 'aprovado' | 'rejeitado',
          pontos_consumidor: product.pontos_consumidor || 0,
          pontos_profissional: product.pontos_profissional || 0,
          vendedor_id: product.vendedor_id,
          segmento_id: product.segmento_id,
          segmento: product.segmento,
          stores: storeInfo,
          vendedores: vendedorData,
          created_at: product.created_at,
          updated_at: product.updated_at,
          // Legacy compatibility
          preco_normal: product.preco_normal // Use actual database field
        };
      });

      console.log('[useDeliveryZoneProducts] Produtos processados:', processedProducts.length);
      return processedProducts;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,
    enabled: !zonesLoading, // Só executar quando as zonas estiverem carregadas
  });

  // Nomes dos vendedores disponíveis para exibição
  const availableVendors = useMemo(() => {
    return currentZones.map(zone => zone.zone_name);
  }, [currentZones]);

  const isLoading = zonesLoading || productsLoading;
  const error = productsError?.message || null;
  const hasDeliveryRestriction = hasActiveZones;
  const totalProducts = products.length;

  return {
    products,
    isLoading,
    error,
    hasDeliveryRestriction,
    availableVendors,
    totalProducts,
    refetch
  };
};
