
import { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { getStores, Store } from '@/services/marketplace/marketplaceService';
import { toast } from '@/components/ui/sonner';

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
export function useMarketplaceData(selectedSegment: string | null): MarketplaceData {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storesError, setStoresError] = useState<string | null>(null);
  
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
  
  // Filtered products based on selected segment
  const filteredProducts = selectedSegment 
    ? products.filter(p => p.segmento === selectedSegment) 
    : products;
  
  return {
    products: filteredProducts,
    stores,
    isLoading,
    storesError
  };
}
