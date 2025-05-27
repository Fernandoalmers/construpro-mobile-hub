
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
  
  // Enhanced and more aggressive product filtering for segments
  const filteredProducts = useMemo(() => {
    if (!selectedSegmentId || selectedSegmentId === 'all') {
      console.log('[useMarketplaceData] No segment filter applied, returning all products:', products.length);
      return products;
    }
    
    const selectedSegment = segments.find(s => s.id === selectedSegmentId);
    const selectedSegmentName = selectedSegment?.nome;
    
    console.log(`[useMarketplaceData] Filtering by segment: ID=${selectedSegmentId}, Name=${selectedSegmentName}`);
    
    // Keywords that could indicate a product belongs to a segment (for fuzzy matching)
    const segmentKeywords: Record<string, string[]> = {
      'Materiais de Construção': ['material', 'construção', 'construcao', 'cimento', 'tijolo', 'areia', 'brita'],
      'Elétrica': ['eletrica', 'elétrica', 'eletrico', 'elétrico', 'luz', 'lampada', 'lâmpada', 'fio', 'tomada', 'interruptor', 'disjuntor'],
      'Hidráulica': ['hidraulica', 'hidráulica', 'agua', 'água', 'cano', 'tubo', 'torneira', 'pia', 'encanamento'],
      'Marmoraria': ['marmor', 'mármore', 'granito', 'pedra', 'bancada'],
      'Equipamentos': ['equipamento', 'máquina', 'maquina', 'ferramenta', 'aluguel'],
      'Profissionais': ['profissional', 'serviço', 'servico', 'mão de obra', 'mao de obra']
    };
    
    // Define keywords for the selected segment
    const currentSegmentKeywords = Object.entries(segmentKeywords).find(([name]) => 
      selectedSegmentName && name.toLowerCase().includes(selectedSegmentName.toLowerCase())
    )?.[1] || [];
    
    if (currentSegmentKeywords.length > 0) {
      console.log('[useMarketplaceData] Using keywords for fuzzy matching:', currentSegmentKeywords);
    }

    return products.filter(product => {
      // Direct match by segment ID (primary way)
      if (product.segmento_id === selectedSegmentId) {
        return true;
      }
      
      // Match by segment name if available
      if (product.segmento && selectedSegmentName && 
          product.segmento.toLowerCase() === selectedSegmentName.toLowerCase()) {
        return true;
      }
      
      // Category match (more relaxed)
      const productCategoryLower = (product.categoria || '').toLowerCase();
      
      // If we have the selected segment name, check for category match with segment name
      if (selectedSegmentName && productCategoryLower.includes(selectedSegmentName.toLowerCase())) {
        console.log(`[useMarketplaceData] Product ${product.id} matched by category: ${product.categoria}`);
        return true;
      }
      
      // Keyword-based matching (fuzzy match)
      if (productCategoryLower && currentSegmentKeywords.length > 0) {
        for (const keyword of currentSegmentKeywords) {
          if (productCategoryLower.includes(keyword)) {
            console.log(`[useMarketplaceData] Product ${product.id} matched by keyword '${keyword}' in category: ${product.categoria}`);
            return true;
          }
          
          // Also check in product name and description for more aggressive matching
          const productNameLower = (product.nome || '').toLowerCase();
          const productDescLower = (product.descricao || '').toLowerCase();
          
          if (productNameLower.includes(keyword) || productDescLower.includes(keyword)) {
            console.log(`[useMarketplaceData] Product ${product.id} matched by keyword '${keyword}' in name/description`);
            return true;
          }
        }
      }
      
      // Special case handling for common categories
      if (selectedSegmentName === "Materiais de Construção" && 
          (productCategoryLower.includes("material") || productCategoryLower.includes("construção") || 
           productCategoryLower.includes("construcao"))) {
        return true;
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
      
      if (filteredProducts.length === 0) {
        console.log('[useMarketplaceData] WARNING: No products matched the segment filter!');
        console.log('[useMarketplaceData] Sample of available products:', 
          products.slice(0, 5).map(p => ({
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
