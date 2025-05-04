
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/services/productService';
import { isProductFavorited } from '@/services/cartService';

interface ProductDetailsState {
  product: Product | null;
  loading: boolean;
  error: string | null;
  isFavorited: boolean;
  reviews: any[];
  estimatedDelivery: {
    minDays: number;
    maxDays: number;
  };
}

export function useProductDetails(id: string | undefined, isAuthenticated: boolean) {
  const [state, setState] = useState<ProductDetailsState>({
    product: null,
    loading: true,
    error: null,
    isFavorited: false,
    reviews: [],
    estimatedDelivery: {
      minDays: 0,
      maxDays: 4
    }
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
              logo_url,
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
        if (data.vendedores && 
            typeof data.vendedores === 'object' && 
            data.vendedores !== null &&
            'nome_loja' in data.vendedores) {
          productData.stores = {
            id: data.vendedor_id,
            nome: String(data.vendedores.nome_loja || ''),
            nome_loja: String(data.vendedores.nome_loja || ''),
            logo_url: String(data.vendedores.logo_url || '')
          };
        }
        
        setState(prev => ({ ...prev, product: productData }));
        
        // Track product view
        if (isAuthenticated) {
          trackProductView(id);
        }
        
        // Check if favorited
        if (isAuthenticated) {
          const favorited = await isProductFavorited(id);
          setState(prev => ({ ...prev, isFavorited: favorited }));
        }
        
        // Fetch reviews separately
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('product_reviews')
          .select(`
            id,
            cliente_id,
            nota,
            comentario,
            data,
            profiles:cliente_id (nome)
          `)
          .eq('produto_id', id)
          .order('data', { ascending: false });
        
        if (!reviewsError && reviewsData) {
          const formattedReviews = reviewsData.map(review => ({
            id: review.id,
            user_name: review.profiles?.nome || 'Usuário',
            rating: review.nota,
            comment: review.comentario,
            date: new Date(review.data).toLocaleDateString('pt-BR')
          }));
          
          setState(prev => ({ ...prev, reviews: formattedReviews }));
        }

        // Calculate delivery estimates based on store policies
        // Default values
        let minDays = 1;
        let maxDays = 5;

        // If we have vendedor delivery info, use it
        const vendedores = data.vendedores;
        if (vendedores && 
            typeof vendedores === 'object' && 
            vendedores !== null && 
            'formas_entrega' in vendedores) {
          const deliveryMethods = vendedores.formas_entrega;
          
          if (Array.isArray(deliveryMethods) && deliveryMethods.length > 0) {
            // Find the fastest delivery option
            const fastestOption = deliveryMethods.reduce((fastest: any, current: any) => {
              const currentMin = current.prazo_min || Infinity;
              const fastestMin = fastest.prazo_min || Infinity;
              return currentMin < fastestMin ? current : fastest;
            }, deliveryMethods[0]);
            
            if (fastestOption) {
              minDays = fastestOption.prazo_min || minDays;
              maxDays = fastestOption.prazo_max || maxDays;
            }
          }
        }
        
        setState(prev => ({ 
          ...prev, 
          estimatedDelivery: {
            minDays,
            maxDays
          },
          loading: false 
        }));
        
      } catch (err) {
        console.error('Error in useProductDetails:', err);
        setState(prev => ({ 
          ...prev, 
          error: 'Erro ao carregar detalhes do produto', 
          loading: false 
        }));
      }
    };
    
    fetchProduct();
  }, [id, isAuthenticated]);
  
  // Function to track product views
  const trackProductView = async (productId: string): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
  
      // Create or update recently viewed entry
      await supabase
        .from('recently_viewed')
        .upsert({
          user_id: userData.user.id,
          produto_id: productId,
          data_visualizacao: new Date().toISOString()
        })
        .select();
  
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  return state;
}
