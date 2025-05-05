
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if product has enough stock for the requested quantity
 */
export const checkProductStock = async (productId: string, quantity: number): Promise<{
  hasStock: boolean;
  product?: any;
  error?: Error;
}> => {
  try {
    // Get product information to check stock and price
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('id, preco_normal, preco_promocional, estoque')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return { 
        hasStock: false, 
        error: new Error('Produto não encontrado') 
      };
    }

    // Check inventory
    if (product.estoque < quantity) {
      return { 
        hasStock: false, 
        product,
        error: new Error(`Apenas ${product.estoque} itens disponíveis em estoque`) 
      };
    }

    return { hasStock: true, product };
  } catch (error: any) {
    console.error('Error checking product stock:', error);
    return { hasStock: false, error };
  }
};

/**
 * Check if adding to cart would exceed available stock
 */
export const checkTotalStockAvailability = async (
  cartId: string, 
  productId: string, 
  quantity: number, 
  existingItem?: { id: string; quantity: number }
): Promise<{
  hasStock: boolean;
  product?: any;
  error?: Error;
}> => {
  try {
    // Get product to check stock
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('id, estoque')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product for stock check:', productError);
      return { 
        hasStock: false, 
        error: new Error('Produto não encontrado') 
      };
    }

    // If there's an existing item, check if the new total exceeds stock
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.estoque < newQuantity) {
        return { 
          hasStock: false, 
          product,
          error: new Error(`Não é possível adicionar mais itens. Apenas ${product.estoque} disponíveis em estoque`) 
        };
      }
    } else {
      // For new items, just check if quantity is available
      if (product.estoque < quantity) {
        return { 
          hasStock: false, 
          product,
          error: new Error(`Apenas ${product.estoque} itens disponíveis em estoque`) 
        };
      }
    }

    return { hasStock: true, product };
  } catch (error: any) {
    console.error('Error checking total stock availability:', error);
    return { hasStock: false, error };
  }
};
