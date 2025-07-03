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

// Timeout wrapper para queries com timeout reduzido
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout - Supabase não respondeu a tempo')), timeoutMs)
    )
  ]);
};

// Retry wrapper com backoff exponencial mais agressivo
const withRetry = async <T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 500
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`🔄 [productSegmentsService] Tentativa ${i + 1}/${maxRetries} falhou:`, error);
      
      if (i < maxRetries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        console.log(`⏳ [productSegmentsService] Aguardando ${backoffDelay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError!;
};

// Health check do Supabase
const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('product_segments').select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
};

// Segmentos de fallback melhorados com ícones
const FALLBACK_SEGMENTS: ProductSegment[] = [
  {
    id: 'material-construcao',
    nome: 'Material de Construção',
    status: 'ativo',
    image_url: '/lovable-uploads/1b629f74-0778-46a1-bb6a-4c30301e733e.png',
    categorias_count: 0
  },
  {
    id: 'eletrica',
    nome: 'Elétrica',
    status: 'ativo',
    categorias_count: 0
  },
  {
    id: 'vidracaria',
    nome: 'Vidraçaria',
    status: 'ativo',
    categorias_count: 0
  },
  {
    id: 'marmoraria',
    nome: 'Marmoraria',
    status: 'ativo',
    categorias_count: 0
  },
  {
    id: 'equipamentos',
    nome: 'Aluguel de Equipamentos',
    status: 'ativo',
    categorias_count: 0
  }
];

export const getProductSegments = async (): Promise<ProductSegment[]> => {
  try {
    console.log('🔄 [productSegmentsService] Iniciando busca otimizada de segmentos...');
    
    // Health check rápido
    const isHealthy = await withTimeout(checkSupabaseHealth(), 2000);
    if (!isHealthy) {
      console.warn('⚠️ [productSegmentsService] Supabase não está saudável, usando fallback');
      return FALLBACK_SEGMENTS;
    }
    
    // Query otimizada sem contagem de categorias para evitar timeout
    const fetchSegments = async () => {
      const { data, error } = await supabase
        .from('product_segments')
        .select('id, nome, image_url, status, created_at, updated_at')
        .eq('status', 'ativo')
        .order('nome');
      
      if (error) throw error;
      return data || [];
    };

    // Tentar com timeout e retry reduzidos
    const rawSegments = await withRetry(
      () => withTimeout(fetchSegments(), 5000),
      3,
      500
    );
    
    console.log('✅ [productSegmentsService] Segmentos carregados:', rawSegments.length);
    
    // Se não há segmentos, retornar fallback
    if (!rawSegments || rawSegments.length === 0) {
      console.warn('⚠️ [productSegmentsService] Nenhum segmento encontrado, usando fallback');
      return FALLBACK_SEGMENTS;
    }
    
    // Convert to ProductSegment[] type
    const segments: ProductSegment[] = rawSegments.map(segment => ({
      ...segment,
      categorias_count: 0 // Initialize with 0 instead of undefined
    }));
    
    return segments;
    
  } catch (error) {
    console.error('❌ [productSegmentsService] Erro ao buscar segmentos:', error);
    
    // Sempre retornar segmentos de fallback em caso de erro
    console.log('🔄 [productSegmentsService] Usando segmentos de fallback devido ao erro');
    return FALLBACK_SEGMENTS;
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
