
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
        
        // Process product data safely with type checking
        const productData: Product = {
          id: data.id,
          nome: data.nome,
          descricao: data.descricao,
          preco: data.preco_normal || 0,
          preco_anterior: data.preco_promocional,
          categoria: data.categoria,
          segmento: data.segmento || '',
          imagem_url: Array.isArray(data.imagens) && data.imagens.length > 0 
            ? String(data.imagens[0])
            : undefined,
          imagens: Array.isArray(data.imagens) 
            ? data.imagens.map(img => String(img))
            : [],
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
