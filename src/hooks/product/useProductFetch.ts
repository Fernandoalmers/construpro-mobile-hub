
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/services/productService';

interface ProductFetchState {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

// Define interfaces for the vendor data structures
interface VendorData {
  id?: string | number;
  nome_loja?: string;
  logo?: string;
  formas_entrega?: Array<{
    prazo_min?: number;
    prazo_max?: number;
    [key: string]: any;
  }>;
  [key: string]: any; // Allow for other properties
}

// Helper function to extract image URLs from different formats
const extractImageUrls = (imageData: any): string[] => {
  const urls: string[] = [];

  if (!imageData) return urls;

  // If it's a string, try to parse it as JSON
  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData);
      if (Array.isArray(parsed)) {
        return parsed.map(img => {
          if (typeof img === 'string') return img;
          if (img && typeof img === 'object') return img.url || img.path || img.src || '';
          return '';
        }).filter(url => url);
      }
      return [imageData]; // Single string URL
    } catch (e) {
      // If it's not valid JSON, treat it as a direct URL
      return [imageData];
    }
  }

  // If it's already an array
  if (Array.isArray(imageData)) {
    imageData.forEach(img => {
      if (typeof img === 'string') {
        urls.push(img);
      } else if (img && typeof img === 'object') {
        const url = img.url || img.path || img.src;
        if (url) urls.push(String(url));
      }
    });
    return urls;
  }

  // If it's an object with url/path/src property
  if (imageData && typeof imageData === 'object') {
    const url = imageData.url || imageData.path || imageData.src;
    if (url) return [String(url)];
  }

  return urls;
};

export function useProductFetch(id: string | undefined) {
  const [state, setState] = useState<ProductFetchState>({
    product: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        // Enhanced query to get all required product details in a single call
        const { data, error } = await supabase
          .from('produtos')
          .select(`
            *,
            vendedores (
              id, 
              nome_loja, 
              logo,
              formas_entrega
            )
          `)
          .eq('id', id)
          .single();
        
        if (error || !data) {
          console.error('Error fetching product:', error);
          setState(prev => ({ ...prev, error: 'Produto não encontrado', loading: false }));
          return;
        }

        console.log("Produto data:", data);
        
        // Extract images properly
        const extractedImages = extractImageUrls(data.imagens);
        console.log("Extracted images:", extractedImages);
        
        // Process product data safely with type checking
        const productData: Product = {
          id: data.id,
          nome: data.nome,
          descricao: data.descricao,
          preco: data.preco_promocional || data.preco_normal || 0,
          preco_normal: data.preco_normal || 0,
          preco_promocional: data.preco_promocional,
          categoria: data.categoria,
          segmento: data.segmento || '',
          imagem_url: extractedImages.length > 0 ? extractedImages[0] : undefined,
          imagens: extractedImages,
          estoque: data.estoque || 0,
          pontos: data.pontos_consumidor || 0,
          pontos_consumidor: data.pontos_consumidor || 0,
          pontos_profissional: data.pontos_profissional || 0,
          loja_id: data.vendedor_id,
          status: data.status as "pendente" | "aprovado" | "rejeitado",
          // Handle unidade_medida which might not exist in the data
          unidade_medida: 'unidade_medida' in data ? String(data.unidade_medida) : 'unidade',
          codigo_barras: data.codigo_barras,
          sku: data.sku,
        };
        
        // Only add store info if vendedores data is available and not an error
        // Using safe type checking with multiple validation checks
        if (data.vendedores && 
            typeof data.vendedores === 'object' && 
            data.vendedores !== null) {
          // Cast vendedorData to the explicit interface
          const vendedorData = data.vendedores as VendorData;
          
          // Additional check to ensure nome_loja property exists
          if ('nome_loja' in vendedorData) {
            productData.stores = {
              id: data.vendedor_id,
              nome: String(vendedorData.nome_loja || ''),
              nome_loja: String(vendedorData.nome_loja || ''),
              logo_url: String(vendedorData.logo || '')
            };
          }
        }
        
        setState(prev => ({ ...prev, product: productData, loading: false }));
        
      } catch (err) {
        console.error('Error in useProductFetch:', err);
        setState(prev => ({ 
          ...prev, 
          error: 'Erro ao carregar detalhes do produto', 
          loading: false 
        }));
      }
    };
    
    fetchProduct();
  }, [id]);

  return state;
}
