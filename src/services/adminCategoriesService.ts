
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';

export interface AdminCategory {
  id: string;
  nome: string;
  segment_id?: string;
  segment_name?: string;
  status: 'ativo' | 'inativo';
  produtos_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminSegment {
  id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  categorias_count: number;
  created_at: string;
  updated_at: string;
}

export const fetchAdminCategories = async (): Promise<AdminCategory[]> => {
  try {
    // Primeiro tentar tabela padronizada 'product_categories'
    try {
      const { data: categories, error } = await supabase
        .from('product_categories')
        .select(`
          id,
          nome,
          segmento_id,
          status,
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
            produtos_count: 0
          };
        }
        
        return {
          ...cat,
          segment_name: segmentMap.get(cat.segmento_id) || 'Geral',
          produtos_count: count || 0
        };
      }));
      
      return categoriesWithProductCounts;
    } catch (error) {
      // Se a tabela padronizada não existir, fazer fallback para categorias da tabela produtos
      console.log('Fallback para categorias da tabela produtos:', error);

      const { data, error: categoriesError } = await supabase
        .from('produtos')
        .select('categoria')
        .order('categoria');
        
      if (categoriesError) throw categoriesError;
      
      // Extrair categorias únicas
      const uniqueCategories = [...new Set(data.map(p => p.categoria))].filter(Boolean);
      
      // Para cada categoria, contar produtos
      const categoriesWithCounts = await Promise.all(uniqueCategories.map(async (catName) => {
        const { count, error: countError } = await supabase
          .from('produtos')
          .select('*', { count: 'exact', head: true })
          .eq('categoria', catName);
          
        if (countError) {
          console.error('Error counting products for category:', countError);
          return {
            id: catName, // Usando o nome como ID para categorias extraídas da tabela produtos
            nome: catName,
            segment_name: 'Geral',
            status: 'ativo',
            produtos_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        return {
          id: catName, // Usando o nome como ID para categorias extraídas da tabela produtos
          nome: catName,
          segment_name: 'Geral',
          status: 'ativo',
          produtos_count: count || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }));
      
      return categoriesWithCounts;
    }
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    toast.error('Erro ao carregar categorias');
    return [];
  }
};

export const fetchAdminSegments = async (): Promise<AdminSegment[]> => {
  try {
    // Primeiro tentar tabela padronizada 'product_segments'
    try {
      const { data, error } = await supabase
        .from('product_segments')
        .select(`
          id,
          nome,
          status,
          created_at,
          updated_at
        `)
        .order('nome');

      if (error) throw error;

      // Para cada segmento, contar categorias associadas
      const segmentsWithCategoryCounts = await Promise.all(data.map(async (segment) => {
        const { count, error: countError } = await supabase
          .from('product_categories')
          .select('*', { count: 'exact', head: true })
          .eq('segmento_id', segment.id);
          
        if (countError) {
          console.error('Error counting categories for segment:', countError);
          return {
            ...segment,
            categorias_count: 0
          };
        }
        
        return {
          ...segment,
          categorias_count: count || 0
        };
      }));
      
      return segmentsWithCategoryCounts;
    } catch (error) {
      // Se a tabela padronizada não existir, fazer fallback
      console.log('Tabela de segmentos não existente:', error);
      
      // Verificar se existe coluna de segmento na tabela produtos
      const { data, error: segmentsError } = await supabase
        .from('produtos')
        .select('segmento')
        .order('segmento');
        
      if (segmentsError) {
        console.error('Erro ao buscar segmentos da tabela produtos:', segmentsError);
        return [];
      }
      
      // Extrair segmentos únicos
      const uniqueSegments = [...new Set(data.map(p => p.segmento))].filter(Boolean);
      
      return uniqueSegments.map(segName => ({
        id: segName, // Usando o nome como ID para segmentos extraídos da tabela produtos
        nome: segName,
        status: 'ativo',
        categorias_count: 0, // Não temos como contar facilmente neste caso
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error('Error fetching admin segments:', error);
    toast.error('Erro ao carregar segmentos');
    return [];
  }
};

export const createCategory = async (categoryData: Omit<AdminCategory, 'id' | 'created_at' | 'updated_at' | 'produtos_count'>): Promise<boolean> => {
  try {
    // Verificar se a tabela product_categories existe
    try {
      const { error } = await supabase
        .from('product_categories')
        .insert({
          nome: categoryData.nome,
          segmento_id: categoryData.segment_id,
          status: categoryData.status
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
      console.error('Erro ao criar categoria na tabela padronizada:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating category:', error);
    toast.error('Erro ao criar categoria. Verifique se a tabela product_categories existe.');
    return false;
  }
};

export const createSegment = async (segmentData: Omit<AdminSegment, 'id' | 'created_at' | 'updated_at' | 'categorias_count'>): Promise<boolean> => {
  try {
    // Verificar se a tabela product_segments existe
    try {
      const { error } = await supabase
        .from('product_segments')
        .insert({
          nome: segmentData.nome,
          status: segmentData.status
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
      console.error('Erro ao criar segmento na tabela padronizada:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating segment:', error);
    toast.error('Erro ao criar segmento. Verifique se a tabela product_segments existe.');
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
        status: categoryData.status,
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
        status: segmentData.status,
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

export const toggleCategoryStatus = async (id: string, currentStatus: 'ativo' | 'inativo'): Promise<boolean> => {
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

export const toggleSegmentStatus = async (id: string, currentStatus: 'ativo' | 'inativo'): Promise<boolean> => {
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
