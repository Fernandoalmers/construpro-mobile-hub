
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
    
    // DEBUG BEABA: Contar produtos da loja Beaba
    const beabaProducts = Array.isArray(products) ? products.filter(p => 
      p?.store_name?.toLowerCase().includes('beaba') || 
      p?.vendedores?.nome_loja?.toLowerCase().includes('beaba')
    ) : [];
    
    console.log('[MarketplaceDataProcessor] 🔍 BEABA DEBUG - Produtos da Beaba recebidos:', beabaProducts.length);
    
    if (beabaProducts.length > 0) {
      console.log('[MarketplaceDataProcessor] 🔍 BEABA DEBUG - Lista de produtos:', 
        beabaProducts.map(p => ({ 
          id: p.id, 
          nome: p.nome, 
          loja: p.store_name || p.vendedores?.nome_loja,
          vendor_id: p.vendedor_id
        }))
      );
    }
    
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
  
  // CORRECTED: Filter products by selected segment with proper null handling
  const segmentFilteredProducts = useMemo(() => {
    console.log('[MarketplaceDataProcessor] Starting segment filtering with selectedSegmentId:', selectedSegmentId);
    
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[MarketplaceDataProcessor] No segment filter - returning ALL products (including null segmento_id):', safeProducts.length);
      
      // Log breakdown of products
      const productsWithSegment = safeProducts.filter(p => p?.segmento_id);
      const productsWithoutSegment = safeProducts.filter(p => !p?.segmento_id);
      console.log(`[MarketplaceDataProcessor] Products with segment: ${productsWithSegment.length}, without segment: ${productsWithoutSegment.length}`);
      
      return safeProducts;
    }
    
    const filtered = safeProducts.filter(product => {
      if (!product) return false;
      
      // Direct match by segment ID
      if (product.segmento_id === selectedSegmentId) {
        return true;
      }
      
      // Fallback: match by segment name if segmento_id is null but segmento name matches
      if (!product.segmento_id && product.segmento) {
        const matchingSegment = safeSegments.find(s => s.id === selectedSegmentId);
        if (matchingSegment && product.segmento.toLowerCase() === matchingSegment.nome?.toLowerCase()) {
          console.log(`[MarketplaceDataProcessor] Product "${product.nome}" matched by segment name fallback`);
          return true;
        }
      }
      
      return false;
    });
    
    console.log('[MarketplaceDataProcessor] Segment filtered products:', filtered.length, 'from', safeProducts.length);
    
    // Debug logging for empty results
    if (filtered.length === 0 && safeProducts.length > 0) {
      console.warn('[MarketplaceDataProcessor] ⚠️ No products matched segment filter!');
      console.warn('Available segment IDs in products:', [...new Set(safeProducts.map(p => p?.segmento_id))]);
      console.warn('Products without segmento_id:', safeProducts.filter(p => !p?.segmento_id).length);
    }
    
    return filtered;
  }, [safeProducts, selectedSegmentId, safeSegments]);
  
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
    
    const categoryList = Array.from(uniqueCategories).map(cat => ({
      id: cat,
      label: cat
    }));
    
    console.log('[MarketplaceDataProcessor] Extracted categories:', categoryList.length);
    return categoryList;
  }, [safeProducts]);

  return {
    safeProducts,
    safeStores,
    safeSegments,
    segmentFilteredProducts,
    categories
  };
};
