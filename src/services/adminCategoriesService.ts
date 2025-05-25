
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminCategory, AdminSegment } from '@/types/admin';
import { uploadSegmentImage, deleteSegmentImage } from '@/services/admin/productSegmentsService';

// Fetch categories with segment information
export const fetchAdminCategories = async (): Promise<AdminCategory[]> => {
  try {
    console.log('[AdminCategoriesService] Fetching categories with segments');
    
    const { data, error } = await supabase
      .from('product_categories')
      .select(`
        id,
        nome,
        status,
        segmento_id,
        created_at,
        updated_at,
        product_segments!inner(nome)
      `)
      .order('nome');
    
    if (error) {
      console.error('[AdminCategoriesService] Error fetching categories:', error);
      throw error;
    }
    
    console.log('[AdminCategoriesService] Raw categories data:', data);
    
    // Transform the data to match AdminCategory interface
    const transformedData = data.map(item => ({
      id: item.id,
      nome: item.nome,
      status: item.status,
      segmento_id: item.segmento_id,
      segment_name: item.product_segments?.nome || 'N/A',
      produtos_count: 0, // Will be calculated separately if needed
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    console.log('[AdminCategoriesService] Transformed categories:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in fetchAdminCategories:', error);
    throw error;
  }
};

// Fetch segments
export const fetchAdminSegments = async (): Promise<AdminSegment[]> => {
  try {
    console.log('[AdminCategoriesService] Fetching segments');
    
    const { data, error } = await supabase
      .from('product_segments')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('[AdminCategoriesService] Error fetching segments:', error);
      throw error;
    }
    
    console.log('[AdminCategoriesService] Segments data:', data);
    
    // Transform the data to match AdminSegment interface
    const transformedData = data.map(item => ({
      id: item.id,
      nome: item.nome,
      status: item.status,
      image_url: item.image_url,
      categorias_count: 0, // Will be calculated separately if needed
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    return transformedData;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in fetchAdminSegments:', error);
    throw error;
  }
};

// Create a new category
export const createCategory = async (categoryData: {
  nome: string;
  segment_id?: string;
  status: string;
}): Promise<boolean> => {
  try {
    console.log('[AdminCategoriesService] Creating category:', categoryData);
    
    const { error } = await supabase
      .from('product_categories')
      .insert([{
        nome: categoryData.nome,
        segmento_id: categoryData.segment_id || null,
        status: categoryData.status
      }]);
    
    if (error) {
      console.error('[AdminCategoriesService] Error creating category:', error);
      toast.error('Erro ao criar categoria: ' + error.message);
      return false;
    }
    
    toast.success('Categoria criada com sucesso!');
    return true;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in createCategory:', error);
    toast.error('Erro ao criar categoria');
    return false;
  }
};

// Create a new segment with image upload
export const createSegment = async (
  segmentData: {
    nome: string;
    status: string;
    image_url?: string | null;
  },
  imageFile?: File
): Promise<boolean> => {
  try {
    console.log('[AdminCategoriesService] Creating segment:', segmentData);
    
    let imageUrl = segmentData.image_url;
    
    // Upload image if provided
    if (imageFile) {
      console.log('[AdminCategoriesService] Uploading image for new segment');
      imageUrl = await uploadSegmentImage(imageFile);
      
      if (!imageUrl) {
        toast.error('Erro ao fazer upload da imagem');
        return false;
      }
    }
    
    const { error } = await supabase
      .from('product_segments')
      .insert([{
        nome: segmentData.nome,
        status: segmentData.status,
        image_url: imageUrl
      }]);
    
    if (error) {
      console.error('[AdminCategoriesService] Error creating segment:', error);
      
      // If segment creation failed and we uploaded an image, clean it up
      if (imageUrl && imageFile) {
        await deleteSegmentImage(imageUrl);
      }
      
      toast.error('Erro ao criar segmento: ' + error.message);
      return false;
    }
    
    toast.success('Segmento criado com sucesso!');
    return true;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in createSegment:', error);
    toast.error('Erro ao criar segmento');
    return false;
  }
};

// Update a category
export const updateCategory = async (
  categoryId: string,
  categoryData: {
    nome: string;
    segment_id?: string;
    status: string;
  }
): Promise<boolean> => {
  try {
    console.log('[AdminCategoriesService] Updating category:', categoryId, categoryData);
    
    const { error } = await supabase
      .from('product_categories')
      .update({
        nome: categoryData.nome,
        segmento_id: categoryData.segment_id || null,
        status: categoryData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId);
    
    if (error) {
      console.error('[AdminCategoriesService] Error updating category:', error);
      toast.error('Erro ao atualizar categoria: ' + error.message);
      return false;
    }
    
    toast.success('Categoria atualizada com sucesso!');
    return true;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in updateCategory:', error);
    toast.error('Erro ao atualizar categoria');
    return false;
  }
};

// Update a segment with image upload
export const updateSegment = async (
  segmentId: string,
  segmentData: {
    nome: string;
    status: string;
    image_url?: string | null;
  },
  imageFile?: File
): Promise<boolean> => {
  try {
    console.log('[AdminCategoriesService] Updating segment:', segmentId, segmentData);
    
    // Get current segment data to check for existing image
    const { data: currentSegment } = await supabase
      .from('product_segments')
      .select('image_url')
      .eq('id', segmentId)
      .single();
    
    let imageUrl = segmentData.image_url;
    
    // Upload new image if provided
    if (imageFile) {
      console.log('[AdminCategoriesService] Uploading new image for segment');
      const newImageUrl = await uploadSegmentImage(imageFile);
      
      if (!newImageUrl) {
        toast.error('Erro ao fazer upload da imagem');
        return false;
      }
      
      // Delete old image if it exists and is different
      if (currentSegment?.image_url && currentSegment.image_url !== newImageUrl) {
        await deleteSegmentImage(currentSegment.image_url);
      }
      
      imageUrl = newImageUrl;
    }
    
    const { error } = await supabase
      .from('product_segments')
      .update({
        nome: segmentData.nome,
        status: segmentData.status,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', segmentId);
    
    if (error) {
      console.error('[AdminCategoriesService] Error updating segment:', error);
      toast.error('Erro ao atualizar segmento: ' + error.message);
      return false;
    }
    
    toast.success('Segmento atualizado com sucesso!');
    return true;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in updateSegment:', error);
    toast.error('Erro ao atualizar segmento');
    return false;
  }
};

// Delete a category
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  try {
    console.log('[AdminCategoriesService] Deleting category:', categoryId);
    
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', categoryId);
    
    if (error) {
      console.error('[AdminCategoriesService] Error deleting category:', error);
      toast.error('Erro ao excluir categoria: ' + error.message);
      return false;
    }
    
    toast.success('Categoria excluída com sucesso!');
    return true;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in deleteCategory:', error);
    toast.error('Erro ao excluir categoria');
    return false;
  }
};

// Delete a segment and its image
export const deleteSegment = async (segmentId: string): Promise<boolean> => {
  try {
    console.log('[AdminCategoriesService] Deleting segment:', segmentId);
    
    // Get segment data to delete associated image
    const { data: segment } = await supabase
      .from('product_segments')
      .select('image_url')
      .eq('id', segmentId)
      .single();
    
    const { error } = await supabase
      .from('product_segments')
      .delete()
      .eq('id', segmentId);
    
    if (error) {
      console.error('[AdminCategoriesService] Error deleting segment:', error);
      toast.error('Erro ao excluir segmento: ' + error.message);
      return false;
    }
    
    // Delete associated image if it exists
    if (segment?.image_url) {
      await deleteSegmentImage(segment.image_url);
    }
    
    toast.success('Segmento excluído com sucesso!');
    return true;
  } catch (error) {
    console.error('[AdminCategoriesService] Error in deleteSegment:', error);
    toast.error('Erro ao excluir segmento');
    return false;
  }
};

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
