
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface ProductFormData {
  id?: string;
  nome: string;
  descricao: string;
  segmento: string;
  categoria?: string;
  codigo_barras?: string;
  sku: string;
  preco: number;
  preco_anterior?: number;
  unidade_venda: string;
  m2_por_caixa?: number;
  estoque: number;
  pontos: number;
  pontos_profissional: number;
  status: 'pendente' | 'aprovado' | 'inativo';
  loja_id: string;
}

export interface ProductImage {
  id?: string;
  product_id?: string;
  url: string;
  ordem: number;
  is_primary: boolean;
}

// Get product segments
export const getProductSegments = async () => {
  try {
    const { data, error } = await supabase
      .from('product_segments')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Error fetching segments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProductSegments:', error);
    return [];
  }
};

// Get categories by segment ID
export const getCategoriesBySegment = async (segmentoId: string) => {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('segmento_id', segmentoId)
      .order('nome');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCategoriesBySegment:', error);
    return [];
  }
};

// Get vendor stores
export const getVendorStores = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_vendor_stores');

    if (error) {
      console.error('Error fetching vendor stores:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getVendorStores:', error);
    return [];
  }
};

// Get vendor products
export const getVendorProducts = async (lojaId?: string, status?: string) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        stores:loja_id (nome, logo_url)
      `);

    if (lojaId) {
      query = query.eq('loja_id', lojaId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getVendorProducts:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string) => {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      return null;
    }

    // Get product images
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('ordem');

    if (imagesError) {
      console.error('Error fetching product images:', imagesError);
    }

    return {
      ...product,
      images: images || []
    };
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};

// Save product
export const saveProduct = async (productData: ProductFormData, images: File[] | string[]) => {
  try {
    // Save or update product
    const isUpdate = !!productData.id;
    
    const { data: product, error: productError } = isUpdate
      ? await supabase
          .from('products')
          .update({
            nome: productData.nome,
            descricao: productData.descricao,
            segmento: productData.segmento,
            categoria: productData.categoria,
            codigo_barras: productData.codigo_barras,
            sku: productData.sku,
            preco: productData.preco,
            preco_anterior: productData.preco_anterior,
            unidade_venda: productData.unidade_venda,
            m2_por_caixa: productData.m2_por_caixa,
            estoque: productData.estoque,
            pontos: productData.pontos,
            pontos_profissional: productData.pontos_profissional,
            status: productData.status,
          })
          .eq('id', productData.id)
          .select()
          .single()
      : await supabase
          .from('products')
          .insert({
            nome: productData.nome,
            descricao: productData.descricao,
            segmento: productData.segmento,
            categoria: productData.categoria,
            codigo_barras: productData.codigo_barras,
            sku: productData.sku,
            preco: productData.preco,
            preco_anterior: productData.preco_anterior,
            unidade_venda: productData.unidade_venda,
            m2_por_caixa: productData.m2_por_caixa,
            estoque: productData.estoque,
            pontos: productData.pontos,
            pontos_profissional: productData.pontos_profissional,
            status: productData.status,
            loja_id: productData.loja_id
          })
          .select()
          .single();

    if (productError) {
      console.error('Error saving product:', productError);
      return { success: false, error: productError.message };
    }

    const productId = product.id;

    // If existing product, delete old images if replaced
    if (isUpdate) {
      // Only delete images if we have new image files
      const hasNewImageFiles = images.some(img => img instanceof File);
      
      if (hasNewImageFiles) {
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);
          
        if (deleteError) {
          console.error('Error deleting old images:', deleteError);
        }
      }
    }

    // Upload new images or save existing image URLs
    const savedImages = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (image instanceof File) {
        // Upload new file
        const fileName = `${Date.now()}_${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(`products/${productId}/${fileName}`, image);
          
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${productId}/${fileName}`);
          
        // Save image record
        const { data: imageRecord, error: imageError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            url: publicUrlData.publicUrl,
            ordem: i,
            is_primary: i === 0
          })
          .select()
          .single();
          
        if (imageError) {
          console.error('Error saving image record:', imageError);
        } else {
          savedImages.push(imageRecord);
        }
      } else if (typeof image === 'string') {
        // This is an existing image URL, no need to upload
        // Just ensure the order is correct
        const { data: imageRecord, error: imageError } = await supabase
          .from('product_images')
          .update({
            ordem: i,
            is_primary: i === 0
          })
          .eq('url', image)
          .eq('product_id', productId)
          .select()
          .single();
          
        if (imageError) {
          console.error('Error updating image record:', imageError);
        } else {
          savedImages.push(imageRecord);
        }
      }
    }

    return {
      success: true,
      product,
      images: savedImages
    };
  } catch (error) {
    console.error('Error in saveProduct:', error);
    return { success: false, error: 'Erro ao salvar o produto.' };
  }
};

// Delete product
export const deleteProduct = async (id: string) => {
  try {
    // Delete product (cascade will delete images)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return { success: false, error: 'Erro ao excluir o produto.' };
  }
};

// Change product status
export const updateProductStatus = async (id: string, status: 'pendente' | 'aprovado' | 'inativo') => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating product status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateProductStatus:', error);
    return { success: false, error: 'Erro ao atualizar o status do produto.' };
  }
};
