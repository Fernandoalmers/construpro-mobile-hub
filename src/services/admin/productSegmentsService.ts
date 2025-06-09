
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface ProductSegment {
  id: string;
  nome: string;
  image_url?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  categorias_count?: number;
}

export const getProductSegments = async (): Promise<ProductSegment[]> => {
  try {
    const { data, error } = await supabase
      .from('product_segments')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    
    // Buscar contagem de categorias para cada segmento
    const segmentsWithCount = await Promise.all(
      data.map(async (segment) => {
        const { count } = await supabase
          .from('product_categories')
          .select('id', { count: 'exact', head: true })
          .eq('segmento_id', segment.id);
        
        return {
          ...segment,
          categorias_count: count || 0
        };
      })
    );
    
    console.log('[SegmentsService] Segments with category count:', segmentsWithCount);
    return segmentsWithCount;
  } catch (error) {
    console.error('Error fetching segments:', error);
    throw error;
  }
};

export const createProductSegment = async (
  segmentData: {
    nome: string;
    status: string;
    image_url?: string | null;
  },
  imageFile?: File
): Promise<boolean> => {
  try {
    let image_url = segmentData.image_url;
    
    // Handle image upload if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `segments/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return false;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      image_url = publicUrl;
    }
    
    const { error } = await supabase
      .from('product_segments')
      .insert([{
        nome: segmentData.nome,
        status: segmentData.status,
        image_url: image_url
      }]);
    
    if (error) {
      console.error('Error creating segment:', error);
      toast.error('Erro ao criar segmento: ' + error.message);
      return false;
    }
    
    toast.success('Segmento criado com sucesso!');
    return true;
  } catch (error) {
    console.error('Error in createProductSegment:', error);
    toast.error('Erro ao criar segmento');
    return false;
  }
};

export const updateProductSegment = async (
  segmentId: string,
  segmentData: {
    nome: string;
    status: string;
    image_url?: string | null;
  },
  imageFile?: File
): Promise<boolean> => {
  try {
    let image_url = segmentData.image_url;
    
    // Handle image upload if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `segments/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return false;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      image_url = publicUrl;
    }
    
    const { error } = await supabase
      .from('product_segments')
      .update({
        nome: segmentData.nome,
        status: segmentData.status,
        image_url: image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', segmentId);
    
    if (error) {
      console.error('Error updating segment:', error);
      toast.error('Erro ao atualizar segmento: ' + error.message);
      return false;
    }
    
    toast.success('Segmento atualizado com sucesso!');
    return true;
  } catch (error) {
    console.error('Error in updateProductSegment:', error);
    toast.error('Erro ao atualizar segmento');
    return false;
  }
};

export const deleteProductSegment = async (segmentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_segments')
      .delete()
      .eq('id', segmentId);
    
    if (error) {
      console.error('Error deleting segment:', error);
      toast.error('Erro ao excluir segmento: ' + error.message);
      return false;
    }
    
    toast.success('Segmento excluído com sucesso!');
    return true;
  } catch (error) {
    console.error('Error in deleteProductSegment:', error);
    toast.error('Erro ao excluir segmento');
    return false;
  }
};

export const uploadSegmentImage = async (imageFile: File): Promise<string | null> => {
  try {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `segments/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadSegmentImage:', error);
    return null;
  }
};

export const deleteSegmentImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(-2).join('/'); // Get segments/filename.ext
    
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteSegmentImage:', error);
    return false;
  }
};
