
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface ProductCategory {
  id: string;
  nome: string;
  segmento_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  segment_name?: string;
  produtos_count?: number;
}

// Get badge color for status
export const getCategoryStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Fetch categories from product_categories table
export const fetchProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    console.log('[CategoriesService] Fetching categories from product_categories table');
    
    const { data, error } = await supabase
      .from('product_categories')
      .select(`
        id,
        nome,
        segmento_id,
        status,
        created_at,
        updated_at,
        product_segments!inner(nome)
      `)
      .order('nome');
    
    if (error) {
      console.error('[CategoriesService] Error fetching categories:', error);
      throw error;
    }
    
    console.log('[CategoriesService] Raw categories data:', data);
    
    // Buscar contagem de produtos para cada categoria
    const categoriesWithCount = await Promise.all(
      data.map(async (item) => {
        // Buscar produtos tanto na tabela products quanto produtos
        const [productsCount, produtosCount] = await Promise.all([
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('categoria', item.nome),
          supabase
            .from('produtos')
            .select('id', { count: 'exact', head: true })
            .eq('categoria', item.nome)
        ]);
        
        const totalCount = (productsCount.count || 0) + (produtosCount.count || 0);
        
        return {
          id: item.id,
          nome: item.nome,
          segmento_id: item.segmento_id,
          status: item.status,
          segment_name: item.product_segments?.nome || 'N/A',
          produtos_count: totalCount,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      })
    );
    
    console.log('[CategoriesService] Categories with product count:', categoriesWithCount);
    return categoriesWithCount;
  } catch (error) {
    console.error('[CategoriesService] Error in fetchProductCategories:', error);
    throw error;
  }
};

// Fetch categories for dropdown (simplified)
export const fetchCategoriesForDropdown = async (): Promise<{ id: string; nome: string; segmento_id: string }[]> => {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, nome, segmento_id')
      .eq('status', 'ativo')
      .order('nome');
    
    if (error) {
      console.error('[CategoriesService] Error fetching categories for dropdown:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[CategoriesService] Error in fetchCategoriesForDropdown:', error);
    throw error;
  }
};

// Create a new category
export const createProductCategory = async (categoryData: {
  nome: string;
  segmento_id: string;
  status: string;
}): Promise<boolean> => {
  try {
    console.log('[CategoriesService] Creating category:', categoryData);
    
    const { error } = await supabase
      .from('product_categories')
      .insert([{
        nome: categoryData.nome,
        segmento_id: categoryData.segmento_id,
        status: categoryData.status
      }]);
    
    if (error) {
      console.error('[CategoriesService] Error creating category:', error);
      toast.error('Erro ao criar categoria: ' + error.message);
      return false;
    }
    
    toast.success('Categoria criada com sucesso!');
    return true;
  } catch (error) {
    console.error('[CategoriesService] Error in createProductCategory:', error);
    toast.error('Erro ao criar categoria');
    return false;
  }
};

// Update a category
export const updateProductCategory = async (
  categoryId: string,
  categoryData: {
    nome: string;
    segmento_id: string;
    status: string;
  }
): Promise<boolean> => {
  try {
    console.log('[CategoriesService] Updating category:', categoryId, categoryData);
    
    const { error } = await supabase
      .from('product_categories')
      .update({
        nome: categoryData.nome,
        segmento_id: categoryData.segmento_id,
        status: categoryData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId);
    
    if (error) {
      console.error('[CategoriesService] Error updating category:', error);
      toast.error('Erro ao atualizar categoria: ' + error.message);
      return false;
    }
    
    toast.success('Categoria atualizada com sucesso!');
    return true;
  } catch (error) {
    console.error('[CategoriesService] Error in updateProductCategory:', error);
    toast.error('Erro ao atualizar categoria');
    return false;
  }
};

// Delete a category
export const deleteProductCategory = async (categoryId: string): Promise<boolean> => {
  try {
    console.log('[CategoriesService] Deleting category:', categoryId);
    
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) {
      console.error('[CategoriesService] Error deleting category:', error);
      toast.error('Erro ao excluir categoria: ' + error.message);
      return false;
    }
    
    toast.success('Categoria excluída com sucesso!');
    return true;
  } catch (error) {
    console.error('[CategoriesService] Error in deleteProductCategory:', error);
    toast.error('Erro ao excluir categoria');
    return false;
  }
};
