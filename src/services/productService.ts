
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_anterior?: number;
  pontos: number;
  categoria: string;
  imagem_url?: string;
  loja_id: string;
  estoque: number;
  avaliacao: number;
  created_at?: string;
  updated_at?: string;
  codigo_barras?: string;
  sku?: string;
  unidade_venda?: string;
  m2_por_caixa?: number;
  segmento?: string;
  pontos_profissional?: number;
  status?: string;
  loja?: {
    nome: string;
    logo_url?: string;
  };
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  ordem: number;
  is_primary: boolean;
}

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        stores:loja_id (nome, logo_url)
      `)
      .eq('status', 'aprovado') // Only approved products
      .gt('estoque', 0) // Only products with stock
      .order('nome');
      
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    // Get primary images for products
    const productsWithImages = await addPrimaryImagesToProducts(data);
    
    return productsWithImages as Product[] || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        stores:loja_id (nome, logo_url)
      `)
      .eq('categoria', category)
      .eq('status', 'aprovado') // Only approved products
      .gt('estoque', 0) // Only products with stock
      .order('nome');
      
    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
    
    // Get primary images for products
    const productsWithImages = await addPrimaryImagesToProducts(data);
    
    return productsWithImages as Product[] || [];
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        stores:loja_id (nome, logo_url)
      `)
      .eq('id', id)
      .single();
      
    if (productError) {
      console.error('Error fetching product by ID:', productError);
      return null;
    }

    // Get all images for this product
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('ordem');
      
    if (imagesError) {
      console.error('Error fetching product images:', imagesError);
    }
    
    return {
      ...product as Product,
      images: images as ProductImage[] || []
    };
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};

// Helper function to add primary images to products
const addPrimaryImagesToProducts = async (products: any[]): Promise<Product[]> => {
  if (!products || products.length === 0) return [];
  
  // Get all product IDs
  const productIds = products.map(p => p.id);
  
  // Get primary images for these products
  const { data: images, error } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds)
    .eq('is_primary', true);
    
  if (error) {
    console.error('Error fetching product images:', error);
    return products as Product[];
  }
  
  // Create image lookup by product ID
  const imagesByProduct = (images || []).reduce((acc, img) => {
    acc[img.product_id] = img;
    return acc;
  }, {} as Record<string, any>);
  
  // Add image URLs to products
  return products.map(product => ({
    ...product,
    imagem_url: imagesByProduct[product.id]?.url || null,
    images: imagesByProduct[product.id] ? [imagesByProduct[product.id]] : []
  }));
};

// Add product review
export const saveProductReview = async (
  productId: string, 
  rating: number, 
  comment?: string
): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      return false;
    }
    
    const { error } = await supabase
      .from('product_reviews')
      .insert({
        produto_id: productId,
        cliente_id: user.user.id,
        nota: rating,
        comentario: comment
      });
      
    if (error) {
      console.error('Error saving product review:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveProductReview:', error);
    return false;
  }
};

// Track product view
export const trackProductView = async (productId: string): Promise<void> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return;
    
    await supabase
      .from('recently_viewed')
      .insert({
        user_id: sessionData.session.user.id,
        produto_id: productId
      });
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
};
