
import { useMemo } from 'react';

interface MarketplaceDataProcessorProps {
  products: any[];
  stores: any[];
  segments: any[];
  selectedSegmentId: string | null;
}

export const useMarketplaceDataProcessor = ({
  products,
  stores,
  segments,
  selectedSegmentId
}: MarketplaceDataProcessorProps) => {
  
  // Ensure data safety with default values
  const safeProducts = useMemo(() => {
    console.log('[MarketplaceDataProcessor] Products received:', products?.length || 0);
    return Array.isArray(products) ? products : [];
  }, [products]);
  
  const safeStores = useMemo(() => {
    console.log('[MarketplaceDataProcessor] Stores received:', stores?.length || 0);
    return Array.isArray(stores) ? stores : [];
  }, [stores]);
  
  const safeSegments = useMemo(() => {
    console.log('[MarketplaceDataProcessor] Segments received:', segments?.length || 0);
    return Array.isArray(segments) ? segments : [];
  }, [segments]);
  
  // Filter products by selected segment with safety checks
  const segmentFilteredProducts = useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[MarketplaceDataProcessor] No segment filter - returning all products:', safeProducts.length);
      return safeProducts;
    }
    
    const filtered = safeProducts.filter(product => 
      product?.segmento_id === selectedSegmentId
    );
    
    console.log('[MarketplaceDataProcessor] Segment filtered products:', filtered.length, 'from', safeProducts.length);
    return filtered;
  }, [safeProducts, selectedSegmentId]);
  
  // Extract categories from products with safety checks
  const categories = useMemo(() => {
    if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
      return [];
    }
    
    const uniqueCategories = new Set(
      safeProducts
        .filter(product => product?.categoria)
        .map(product => product.categoria)
    );
    
    return Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
  }, [safeProducts]);

  return {
    safeProducts,
    safeStores,
    safeSegments,
    segmentFilteredProducts,
    categories
  };
};
