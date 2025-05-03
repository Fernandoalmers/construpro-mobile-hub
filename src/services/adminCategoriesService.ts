
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';
import { AdminCategory, AdminSegment } from '@/types/admin';

export const fetchAdminCategories = async (): Promise<AdminCategory[]> => {
  try {
    // Check if the product_categories table exists
    const { error: tableCheckError } = await supabase
      .from('product_categories')
      .select('count')
      .limit(1)
      .single();
    
    // If product_categories table doesn't exist, use fallback
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log('Product categories table does not exist, using fallback method');
      // Fallback to categories from produtos table
      const { data, error: categoriesError } = await supabase
        .from('produtos')
        .select('categoria')
        .order('categoria');
        
      if (categoriesError) throw categoriesError;
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.map(p => p.categoria))).filter(Boolean);
      
      // For each category, count products
      const categoriesWithCounts = await Promise.all(uniqueCategories.map(async (catName) => {
        if (!catName) return null;
        
        const { count, error: countError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('categoria', catName);
          
        if (countError) {
          console.error('Error counting products for category:', countError);
          return {
            id: catName as string, // Usando o nome como ID para categorias extraídas da tabela produtos
            nome: catName as string,
            segment_name: 'Geral',
            status: 'ativo',
            produtos_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        return {
          id: catName as string, // Usando o nome como ID para categorias extraídas da tabela produtos
          nome: catName as string,
          segment_name: 'Geral',
          status: 'ativo',
          produtos_count: count || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }));
      
      return categoriesWithCounts.filter(Boolean) as AdminCategory[];
    }
    
    // If the table exists, use it
    const { data: categories, error } = await supabase
      .from('product_categories')
      .select(`
        id,
        nome,
        segmento_id,
        created_at,
        updated_at
      `)
      .order('nome');

    if (error) throw error;

    // Buscar nomes dos segmentos
    const segmentIds = categories
      .filter(cat => cat.segmento_id)
      .map(cat => cat.segmento_id);
    
    const { data: segments } = await supabase
      .from('product_segments')
      .select('id, nome')
      .in('id', segmentIds);
    
    // Criar um mapa para associar rapidamente IDs de segmentos aos seus nomes
    const segmentMap = new Map();
    segments?.forEach(s => segmentMap.set(s.id, s.nome));

    // Para cada categoria, contar produtos associados
    const categoriesWithProductCounts = await Promise.all(categories.map(async (cat) => {
      const { count, error: countError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true })
        .eq('categoria', cat.nome);
        
      if (countError) {
        console.error('Error counting products for category:', countError);
        return {
          ...cat,
          segment_name: segmentMap.get(cat.segmento_id) || 'Geral',
          status: 'ativo', // Default status if not present
          produtos_count: 0
        };
      }
      
      return {
        ...cat,
        segment_name: segmentMap.get(cat.segmento_id) || 'Geral',
        status: 'ativo', // Default status if not present
        produtos_count: count || 0
      };
    }));
    
    return categoriesWithProductCounts;
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    toast.error('Erro ao carregar categorias');
    return [];
  }
};

export const fetchAdminSegments = async (): Promise<AdminSegment[]> => {
  try {
    // Check if product_segments table exists
    const { error: tableCheckError } = await supabase
      .from('product_segments')
      .select('count')
      .limit(1)
      .single();
    
    // If table doesn't exist, return basic segments
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log('Product segments table does not exist, using fallback');
      
      // Check if produtos table has segmento column
      try {
        const { data, error: segmentsError } = await supabase
          .from('produtos')
          .select('segmento')
          .order('segmento');
          
        if (segmentsError) {
          console.error('Error fetching segments from produtos:', segmentsError);
          return [];
        }
        
        // Extract unique segments
        const uniqueSegments = Array.from(new Set(data.map(p => p.segmento))).filter(Boolean);
        
        return uniqueSegments.map(segName => ({
          id: segName as string, // Using name as ID for segments extracted from products table
          nome: segName as string,
          status: 'ativo',
          categorias_count: 0, // No easy way to count categories in this case
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      } catch (err) {
        console.error('Error in segments fallback:', err);
        return [];
      }
    }
    
    // If table exists, use it
    const { data, error } = await supabase
      .from('product_segments')
      .select(`
        id,
        nome,
        created_at,
        updated_at
      `)
      .order('nome');

    if (error) throw error;

    // For each segment, count associated categories
    const segmentsWithCategoryCounts = await Promise.all(data.map(async (segment) => {
      const { count, error: countError } = await supabase
        .from('product_categories')
        .select('*', { count: 'exact', head: true })
        .eq('segmento_id', segment.id);
        
      if (countError) {
        console.error('Error counting categories for segment:', countError);
        return {
          ...segment,
          status: 'ativo', // Default status if not present
          categorias_count: 0
        };
      }
      
      return {
        ...segment,
        status: 'ativo', // Default status if not present
        categorias_count: count || 0
      };
    }));
    
    return segmentsWithCategoryCounts;
  } catch (error) {
    console.error('Error fetching admin segments:', error);
    toast.error('Erro ao carregar segmentos');
    return [];
  }
};

export const createCategory = async (categoryData: Omit<AdminCategory, 'id' | 'created_at' | 'updated_at' | 'produtos_count' | 'segment_name'>): Promise<boolean> => {
  try {
    // Check if table exists
    const { error: tableCheckError } = await supabase
      .from('product_categories')
      .select('count')
      .limit(1)
      .single();
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      toast.error('A tabela de categorias não existe. Crie-a primeiro');
      return false;
    }
    
    const { error } = await supabase
      .from('product_categories')
      .insert({
        nome: categoryData.nome,
        segmento_id: categoryData.segment_id,
      });
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'create_category',
      entityType: 'categoria',
      entityId: 'new',
      details: { nome: categoryData.nome, segmento_id: categoryData.segment_id }
    });
    
    toast.success('Categoria criada com sucesso');
    return true;
  } catch (error) {
    console.error('Error creating category:', error);
    toast.error('Erro ao criar categoria');
    return false;
  }
};

export const createSegment = async (segmentData: Omit<AdminSegment, 'id' | 'created_at' | 'updated_at' | 'categorias_count'>): Promise<boolean> => {
  try {
    // Check if table exists
    const { error: tableCheckError } = await supabase
      .from('product_segments')
      .select('count')
      .limit(1)
      .single();
    
    if (tableCheckError && tableCheckError.code === '42P01') {
      toast.error('A tabela de segmentos não existe. Crie-a primeiro');
      return false;
    }
    
    const { error } = await supabase
      .from('product_segments')
      .insert({
        nome: segmentData.nome,
      });
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'create_segment',
      entityType: 'segmento',
      entityId: 'new',
      details: { nome: segmentData.nome }
    });
    
    toast.success('Segmento criado com sucesso');
    return true;
  } catch (error) {
    console.error('Error creating segment:', error);
    toast.error('Erro ao criar segmento');
    return false;
  }
};

export const updateCategory = async (id: string, categoryData: Partial<AdminCategory>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_categories')
      .update({
        nome: categoryData.nome,
        segmento_id: categoryData.segment_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'update_category',
      entityType: 'categoria',
      entityId: id,
      details: categoryData
    });
    
    toast.success('Categoria atualizada com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    toast.error('Erro ao atualizar categoria');
    return false;
  }
};

export const updateSegment = async (id: string, segmentData: Partial<AdminSegment>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_segments')
      .update({
        nome: segmentData.nome,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'update_segment',
      entityType: 'segmento',
      entityId: id,
      details: segmentData
    });
    
    toast.success('Segmento atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating segment:', error);
    toast.error('Erro ao atualizar segmento');
    return false;
  }
};

export const toggleCategoryStatus = async (id: string, currentStatus: string): Promise<boolean> => {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
  
  try {
    const { error } = await supabase
      .from('product_categories')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'toggle_category_status',
      entityType: 'categoria',
      entityId: id,
      details: { status: newStatus }
    });
    
    toast.success(`Categoria ${newStatus === 'ativo' ? 'ativada' : 'desativada'} com sucesso`);
    return true;
  } catch (error) {
    console.error('Error toggling category status:', error);
    toast.error('Erro ao alterar status da categoria');
    return false;
  }
};

export const toggleSegmentStatus = async (id: string, currentStatus: string): Promise<boolean> => {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
  
  try {
    const { error } = await supabase
      .from('product_segments')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'toggle_segment_status',
      entityType: 'segmento',
      entityId: id,
      details: { status: newStatus }
    });
    
    toast.success(`Segmento ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`);
    return true;
  } catch (error) {
    console.error('Error toggling segment status:', error);
    toast.error('Erro ao alterar status do segmento');
    return false;
  }
};

export const getCategoryStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
