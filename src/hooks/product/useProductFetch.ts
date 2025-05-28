
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
  telefone?: string;
  email?: string;
  formas_entrega?: Array<{
    prazo_min?: number;
    prazo_max?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
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
        
        // ENHANCED: Query to get product with vendor information
        const { data, error } = await supabase
          .from('produtos')
          .select(`
            *,
            vendedores:vendedor_id (
              id, 
              nome_loja, 
              logo,
              telefone,
              email,
              formas_entrega
            )
          `)
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          console.error('[useProductFetch] Error fetching product:', error);
          setState(prev => ({ ...prev, error: 'Produto não encontrado', loading: false }));
          return;
        }

        if (!data) {
          setState(prev => ({ ...prev, error: 'Produto não encontrado', loading: false }));
          return;
        }

        console.log("[useProductFetch] Raw product data with vendor:", {
          id: data.id,
          nome: data.nome,
          vendedor_id: data.vendedor_id,
          vendedores: data.vendedores
        });
        
        // Extract images properly
        const extractedImages = extractImageUrls(data.imagens);
        console.log("[useProductFetch] Extracted images:", extractedImages);
        
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
          unidade_medida: 'unidade_medida' in data ? String(data.unidade_medida) : 'unidade',
          codigo_barras: data.codigo_barras,
          sku: data.sku,
        };
        
        // ENHANCED: Process vendor information with better handling
        if (data.vendedores && 
            typeof data.vendedores === 'object' && 
            data.vendedores !== null) {
          const vendedorData = data.vendedores as VendorData;
          
          if ('nome_loja' in vendedorData && vendedorData.nome_loja) {
            productData.stores = {
              id: data.vendedor_id,
              nome: String(vendedorData.nome_loja),
              nome_loja: String(vendedorData.nome_loja),
              logo_url: String(vendedorData.logo || '')
            };
            
            console.log("[useProductFetch] ✅ Successfully processed vendor info:", {
              productName: productData.nome,
              storeName: productData.stores.nome_loja,
              storeId: productData.stores.id
            });
          } else {
            console.warn("[useProductFetch] ⚠️ Vendor data exists but missing nome_loja:", vendedorData);
          }
        } else {
          console.warn("[useProductFetch] ⚠️ No vendor data found for product:", {
            productId: data.id,
            vendedor_id: data.vendedor_id
          });
        }
        
        setState(prev => ({ ...prev, product: productData, loading: false }));
        
      } catch (err) {
        console.error('[useProductFetch] Unexpected error:', err);
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
