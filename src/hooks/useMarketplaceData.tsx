
import React, { useState, useEffect, useMemo } from 'react';
import { getProducts } from '@/services/productService';
import { getStores, Store } from '@/services/marketplace/marketplaceService';
import { toast } from '@/components/ui/sonner';
import { getProductSegments } from '@/services/admin/productSegmentsService';
import { getMarketplaceProducts } from '@/services/marketplaceProductsService';

export interface MarketplaceData {
  products: any[];
  stores: Store[];
  isLoading: boolean;
  storesError: string | null;
}

/**
 * Custom hook for fetching marketplace data
 * @returns Products and stores data, loading states and error states
 */
export function useMarketplaceData(selectedSegmentId: string | null): MarketplaceData {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [segments, setSegments] = useState<{id: string, nome: string}[]>([]);
  
  // Improved logging for debugging
  useEffect(() => {
    console.log('[useMarketplaceData] selectedSegmentId:', selectedSegmentId);
  }, [selectedSegmentId]);
  
  // Fetch segments on initial load
  useEffect(() => {
    const loadSegments = async () => {
      try {
        const segmentsData = await getProductSegments();
        console.log('[useMarketplaceData] Loaded segments:', segmentsData);
        setSegments(segmentsData);
      } catch (error) {
        console.error('[useMarketplaceData] Error loading segments:', error);
      }
    };
    
    loadSegments();
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('[useMarketplaceData] Fetching marketplace data');
        
        // Fetch products using improved marketplace service
        const productsData = await getMarketplaceProducts();
        console.log('[useMarketplaceData] Fetched products:', productsData.length);
        setProducts(productsData);
        
        // Fetch stores
        try {
          const storesData = await getStores();
          console.log('[useMarketplaceData] Fetched stores:', storesData.length);
          setStores(storesData);
        } catch (storeError) {
          console.error('[useMarketplaceData] Error fetching stores:', storeError);
          setStoresError((storeError as Error).message || 'Erro ao carregar lojas');
          toast.error('Erro ao carregar lojas');
        }
      } catch (error) {
        console.error('[useMarketplaceData] Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Enhanced product filtering to handle both segmento_id and categoria
  const filteredProducts = useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[useMarketplaceData] No segment filter applied, returning all products:', products.length);
      return products;
    }
    
    const selectedSegment = segments.find(s => s.id === selectedSegmentId);
    const selectedSegmentName = selectedSegment?.nome;
    
    console.log(`[useMarketplaceData] Filtering by segment: ID=${selectedSegmentId}, Name=${selectedSegmentName}`);
    
    return products.filter(product => {
      // Match by segment ID (primary way)
      if (product.segmento_id === selectedSegmentId) {
        return true;
      }
      
      // Match by segment name if available (fallback)
      if (product.segmento && selectedSegmentName && 
          product.segmento.toLowerCase().includes(selectedSegmentName.toLowerCase())) {
        return true;
      }
      
      // Special handling for "Materiais de Construção" segment
      if (selectedSegmentName === "Materiais de Construção" || 
          selectedSegmentName?.toLowerCase().includes("material")) {
        // Match by exact category
        if (product.categoria && 
            (product.categoria.toLowerCase().includes("material") || 
             product.categoria.toLowerCase().includes("construção"))) {
          return true;
        }
      }
      
      // Enhanced matching for other segments
      if (selectedSegmentName && product.categoria) {
        // Try to match segment name with product category
        const segmentWordsLower = selectedSegmentName.toLowerCase().split(/\s+/);
        const categoryLower = product.categoria.toLowerCase();
        
        // If any significant word from segment name appears in category
        for (const word of segmentWordsLower) {
          // Skip common words
          if (word.length <= 2 || ['de', 'da', 'do', 'para'].includes(word)) continue;
          
          if (categoryLower.includes(word)) {
            console.log(`[useMarketplaceData] Matched product ${product.nome} to segment by word "${word}" in category`);
            return true;
          }
        }
      }
      
      return false;
    });
  }, [products, selectedSegmentId, segments]);
  
  // Add detailed logging to help debug filtering
  useEffect(() => {
    if (selectedSegmentId && selectedSegmentId !== 'all') {
      const selectedSegment = segments.find(s => s.id === selectedSegmentId);
      console.log(
        `[useMarketplaceData] Filtering results: ` +
        `Total products: ${products.length}, ` +
        `Filtered products: ${filteredProducts.length}, ` +
        `Selected segment: ${selectedSegment?.nome || 'Unknown'} (${selectedSegmentId})`
      );
      
      // Log sample of the filtered products
      if (filteredProducts.length > 0) {
        console.log('[useMarketplaceData] Sample of filtered products:', 
          filteredProducts.slice(0, 3).map(p => ({
            id: p.id,
            nome: p.nome, 
            segmento_id: p.segmento_id,
            segmento: p.segmento,
            categoria: p.categoria
          }))
        );
      } else {
        console.log('[useMarketplaceData] No products matched the segment filter');
      }
    }
  }, [selectedSegmentId, filteredProducts.length, products.length, segments]);
  
  return {
    products: filteredProducts,
    stores,
    isLoading,
    storesError
  };
}
