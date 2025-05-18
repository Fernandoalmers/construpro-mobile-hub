
import { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { getStores, Store } from '@/services/marketplace/marketplaceService';
import { toast } from '@/components/ui/sonner';
import { getProductSegments } from '@/services/admin/productSegmentsService';

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
  
  // Fetch segments on initial load
  useEffect(() => {
    const loadSegments = async () => {
      try {
        const segmentsData = await getProductSegments();
        setSegments(segmentsData);
      } catch (error) {
        console.error('Error loading segments:', error);
      }
    };
    
    loadSegments();
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products
        const productsData = await getProducts();
        setProducts(productsData);
        
        // Fetch stores
        try {
          const storesData = await getStores();
          setStores(storesData);
        } catch (storeError) {
          console.error('Error fetching stores:', storeError);
          setStoresError((storeError as Error).message || 'Erro ao carregar lojas');
          toast.error('Erro ao carregar lojas');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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
        
        // Match by either segmento_id (primary) or segmento name (fallback)
        return (
          p.segmento_id === selectedSegmentId || 
          (p.segmento && selectedSegmentName && 
           p.segmento.toLowerCase() === selectedSegmentName.toLowerCase()) ||
          // Additional fallback for materials category when "Materiais de Construção" segment is selected
          (selectedSegmentName === "Materiais de Construção" && 
           p.categoria && p.categoria.toLowerCase().includes("material"))
        );
      })
    : products;
  
  return {
    products: filteredProducts,
    stores,
    isLoading,
    storesError
  };
}
