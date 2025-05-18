
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Get all approved products
export const getProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('produtos')
      .select('*')
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });
    
    // Apply any additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    toast.error('Erro ao carregar produtos');
    return [];
  }
};

// Get product by ID
export const getProductById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (nome_loja)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};
