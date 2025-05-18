
import { useState, useEffect } from 'react';
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
  
  // Logging for debugging
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
  
  // Enhanced product filtering based on selected segment ID
  const filteredProducts = selectedSegmentId && selectedSegmentId !== 'all'
    ? products.filter(p => {
        // Find the segment name corresponding to the selected ID
        const selectedSegment = segments.find(s => s.id === selectedSegmentId);
        const selectedSegmentName = selectedSegment?.nome;
        
        console.log(
          `[useMarketplaceData] Filtering product "${p.nome}": ` +
          `segmento_id=${p.segmento_id}, segmento=${p.segmento}, ` +
          `selectedSegmentId=${selectedSegmentId}, selectedSegmentName=${selectedSegmentName}`
        );
        
        // Match by either segmento_id (primary) or segmento name (fallback)
        const matchesById = p.segmento_id === selectedSegmentId;
        const matchesByName = p.segmento && selectedSegmentName && 
          p.segmento.toLowerCase() === selectedSegmentName.toLowerCase();
          
        // Special case for "Materiais de Construção" segment - match also by category
        const isMaterialDeContrucao = selectedSegmentName === "Materiais de Construção";
        const matchesByMaterialCategory = isMaterialDeContrucao && 
          p.categoria && typeof p.categoria === 'string' && 
          (p.categoria.toLowerCase().includes("material") || p.categoria.toLowerCase().includes("construção"));
        
        const result = matchesById || matchesByName || matchesByMaterialCategory;
        
        // Debug logging
        if (result) {
          console.log(`[useMarketplaceData] Product "${p.nome}" MATCHED segment filter`);
        }
        
        return result;
      })
    : products;
  
  // Additional logging to help debug segment filtering
  useEffect(() => {
    if (selectedSegmentId && selectedSegmentId !== 'all') {
      const selectedSegment = segments.find(s => s.id === selectedSegmentId);
      console.log(
        `[useMarketplaceData] Segment filtering results: ` +
        `Total products: ${products.length}, ` +
        `Filtered products: ${filteredProducts.length}, ` +
        `Selected segment: ${selectedSegment?.nome || 'Unknown'} (${selectedSegmentId})`
      );
    }
  }, [selectedSegmentId, filteredProducts.length, products.length, segments]);
  
  return {
    products: filteredProducts,
    stores,
    isLoading,
    storesError
  };
}
