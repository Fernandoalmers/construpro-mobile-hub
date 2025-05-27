
import React, { useState, useEffect, useMemo } from 'react';
import { getStores, Store } from '@/services/marketplace/marketplaceService';
import { toast } from '@/components/ui/sonner';
import { getProductSegments } from '@/services/admin/productSegmentsService';
import { getMarketplaceProducts } from '@/services/marketplaceProductsService';

export interface MarketplaceData {
  products: any[];
  stores: Store[];
  isLoading: boolean;
  storesError: string | null;
  refreshSegments: () => Promise<void>;
}

/**
 * Custom hook for fetching marketplace data - accessible to ALL authenticated users
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
  const loadSegments = async () => {
    try {
      console.log('[useMarketplaceData] Loading segments...');
      const segmentsData = await getProductSegments();
      console.log('[useMarketplaceData] Loaded segments:', segmentsData);
      setSegments(segmentsData);
    } catch (error) {
      console.error('[useMarketplaceData] Error loading segments:', error);
    }
  };
  
  useEffect(() => {
    loadSegments();
  }, []);
  
  // Function to refresh segments (can be called manually)
  const refreshSegments = async () => {
    console.log('[useMarketplaceData] Refreshing segments...');
    await loadSegments();
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('[useMarketplaceData] Fetching marketplace data for ALL users');
        
        // Fetch products using improved marketplace service - NO user restrictions
        const productsData = await getMarketplaceProducts();
        console.log('[useMarketplaceData] Fetched products:', productsData.length);
        
        // Add debug logging for each product
        if (productsData.length > 0) {
          console.log('[useMarketplaceData] Sample products:', productsData.slice(0, 3).map(p => ({
            id: p.id,
            nome: p.nome,
            status: p.status,
            segmento_id: p.segmento_id
          })));
        }
        
        setProducts(productsData);
        
        // Fetch stores
        try {
          const storesData = await getStores();
          console.log('[useMarketplaceData] Fetched stores:', storesData.length);
          setStores(storesData);
          setStoresError(null);
        } catch (storeError) {
          console.error('[useMarketplaceData] Error fetching stores:', storeError);
          setStoresError((storeError as Error).message || 'Erro ao carregar lojas');
          // Don't show toast error for stores as it's not critical
        }
      } catch (error) {
        console.error('[useMarketplaceData] Error fetching data:', error);
        toast.error('Erro ao carregar dados do marketplace');
        setProducts([]); // Ensure we have an empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Enhanced product filtering for segments
  const filteredProducts = useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[useMarketplaceData] No segment filter applied, returning all products:', products.length);
      return products;
    }
    
    const selectedSegment = segments.find(s => s.id === selectedSegmentId);
    const selectedSegmentName = selectedSegment?.nome;
    
    console.log(`[useMarketplaceData] Filtering by segment: ID=${selectedSegmentId}, Name=${selectedSegmentName}`);
    
    const filtered = products.filter(product => {
      // Direct match by segment ID (primary way)
      if (product.segmento_id === selectedSegmentId) {
        return true;
      }
      
      // Match by segment name if available
      if (product.segmento && selectedSegmentName && 
          product.segmento.toLowerCase() === selectedSegmentName.toLowerCase()) {
        return true;
      }
      
      return false;
    });
    
    console.log(`[useMarketplaceData] Filtered ${filtered.length} products from ${products.length} total`);
    return filtered;
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
      
      if (filteredProducts.length === 0 && products.length > 0) {
        console.log('[useMarketplaceData] WARNING: No products matched the segment filter!');
        console.log('[useMarketplaceData] Sample of available products:', 
          products.slice(0, 3).map(p => ({
            id: p.id,
            nome: p.nome, 
            segmento_id: p.segmento_id,
            segmento: p.segmento,
            categoria: p.categoria
          }))
        );
      }
    }
  }, [selectedSegmentId, filteredProducts.length, products.length, segments]);
  
  return {
    products: filteredProducts,
    stores,
    isLoading,
    storesError,
    refreshSegments
  };
}
