import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface MarketplaceProduct {
  id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional?: number;
  pontos_consumidor: number;
  categoria: string;
  imagens: string[];
  imagemPrincipal?: string;
  estoque: number;
  vendedor_id: string;
  vendedor_nome: string;
  created_at?: string;
  segmento?: string;
  segmento_id?: string;
}

/**
 * Get approved products for marketplace display
 */
export const getMarketplaceProducts = async (categoria?: string): Promise<MarketplaceProduct[]> => {
  try {
    // Build base query
    let query = supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (nome_loja)
      `)
      .eq('status', 'aprovado')
      .gt('estoque', 0)
      .order('created_at', { ascending: false });
      
    // Filter by category if provided
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching marketplace products:', error);
      throw error;
    }
    
    // Transform to marketplace product format
    return (data || []).map(item => {
      // Find the primary image or first available
      let imagemPrincipal = null;
      // Ensure imagens is an array and cast from JSON to string[]
      const imagensArray: string[] = Array.isArray(item.imagens) 
        ? item.imagens.map(img => String(img))
        : [];
      
      if (imagensArray.length > 0) {
        imagemPrincipal = imagensArray[0];
      }
      
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        preco_normal: item.preco_normal,
        preco_promocional: item.preco_promocional,
        pontos_consumidor: item.pontos_consumidor || 0,
        categoria: item.categoria,
        segmento: item.segmento,
        segmento_id: item.segmento_id,
        imagens: imagensArray,
        imagemPrincipal,
        estoque: item.estoque,
        vendedor_id: item.vendedor_id,
        vendedor_nome: item.vendedores?.nome_loja || 'Loja não identificada',
        created_at: item.created_at
      };
    });
  } catch (error) {
    console.error('Error in getMarketplaceProducts:', error);
    toast.error('Erro ao carregar produtos');
    return [];
  }
};

/**
 * Get a single product for marketplace display
 */
export const getMarketplaceProductById = async (id: string): Promise<MarketplaceProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (nome_loja)
      `)
      .eq('id', id)
      .eq('status', 'aprovado')
      .single();
    
    if (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
    
    if (!data) return null;
    
    // Cast imagens from JSON to string[]
    const imagensArray: string[] = Array.isArray(data.imagens) 
      ? data.imagens.map(img => String(img))
      : [];
    
    // Find the primary image or first available
    let imagemPrincipal = null;
    if (imagensArray.length > 0) {
      imagemPrincipal = imagensArray[0];
    }
    
    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao,
      preco_normal: data.preco_normal,
      preco_promocional: data.preco_promocional,
      pontos_consumidor: data.pontos_consumidor || 0,
      categoria: data.categoria,
      segmento: data.segmento,
      segmento_id: data.segmento_id,
      imagens: imagensArray,
      imagemPrincipal,
      estoque: data.estoque,
      vendedor_id: data.vendedor_id,
      vendedor_nome: data.vendedores?.nome_loja || 'Loja não identificada',
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in getMarketplaceProductById:', error);
    return null;
  }
};
