
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AdminProduct } from '@/types/admin';

/**
 * Fetch pending products for admin approval
 */
export const getPendingProducts = async (): Promise<AdminProduct[]> => {
  try {
    console.log('[getPendingProducts] query pendentes');
    
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        preco_normal,
        estoque,
        status,
        vendedor_id,
        vendedores!inner(nome_loja),
        imagens
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
    
    console.log('[getPendingProducts] data:', data, 'error:', error);
    
    if (error) {
      console.error('[getPendingProducts] Error fetching pending products:', error);
      toast({
        title: "Error",
        description: "Erro ao carregar produtos pendentes",
        variant: "destructive"
      });
      throw error;
    }

    console.log(`[getPendingProducts] Found ${data?.length || 0} pending products`);
    
    // Transform data to AdminProduct format
    const productsWithVendorInfo = (data || []).map(item => {
      // Get the first image URL from the images array if available
      let imageUrl = null;
      if (item.imagens && Array.isArray(item.imagens) && item.imagens.length > 0) {
        imageUrl = item.imagens[0];
      }
      
      // Use vendedor name from join with vendedores table
      const vendorInfo = item.vendedores as { nome_loja?: string } || {};
      const vendorName = vendorInfo.nome_loja || 'Loja desconhecida';
      
      return {
        id: item.id,
        nome: item.nome,
        descricao: "",
        categoria: "",
        imagemUrl: imageUrl,
        preco: item.preco_normal,
        preco_normal: item.preco_normal,
        preco_promocional: null,
        estoque: item.estoque,
        pontos: 0,
        pontos_consumidor: 0,
        pontos_profissional: 0,
        lojaId: item.vendedor_id,
        vendedor_id: item.vendedor_id,
        lojaNome: vendorName,
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: "",
        updated_at: "",
        imagens: Array.isArray(item.imagens) ? item.imagens.filter(img => typeof img === 'string') : [],
        vendedores: item.vendedores
      };
    });
    
    return productsWithVendorInfo;
  } catch (error) {
    console.error('[getPendingProducts] Error in getPendingProducts:', error);
    toast({
      title: "Error",
      description: "Erro ao carregar produtos pendentes",
      variant: "destructive"
    });
    throw error;
  }
};

// Update the existing function for backwards compatibility
export const fetchPendingProducts = getPendingProducts;
