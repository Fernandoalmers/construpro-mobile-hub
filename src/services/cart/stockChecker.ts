
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
    console.log(`[stockChecker] Checking stock for product: ${productId}, quantity: ${quantity}`);
    
    // Get product information to check stock and price
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('id, preco_normal, preco_promocional, estoque, nome')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return { 
        hasStock: false, 
        error: new Error('Produto não encontrado') 
      };
    }

    // Log the product for debugging
    console.log(`[stockChecker] Product details:`, {
      id: product.id,
      name: product.nome,
      stock: product.estoque, 
      requestedQty: quantity
    });

    // Check inventory
    if (quantity <= 0) {
      return {
        hasStock: false,
        product,
        error: new Error('Quantidade inválida')
      };
    }

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
    return { 
      hasStock: false, 
      error: error instanceof Error ? error : new Error(error.message || 'Erro ao verificar estoque') 
    };
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
    console.log(`[stockChecker] Checking total stock availability for product: ${productId}, requested qty: ${quantity}`);
    
    // Get product to check stock
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('id, estoque, nome')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product for stock check:', productError);
      return { 
        hasStock: false, 
        error: new Error('Produto não encontrado') 
      };
    }

    // Log the product stock for debugging
    console.log(`[stockChecker] Product stock check:`, {
      id: product.id,
      name: product.nome,
      availableStock: product.estoque,
      requestedQty: quantity,
      existingItemQty: existingItem?.quantity || 0
    });

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
    return { 
      hasStock: false, 
      error: error instanceof Error ? error : new Error(error.message || 'Erro ao verificar disponibilidade de estoque') 
    };
  }
};

/**
 * Validate item quantities against current inventory
 * This is useful for refreshing cart to ensure all items are still in stock
 */
export const validateCartItemsStock = async (cartId: string): Promise<{
  validItems: Array<{id: string, product_id: string, quantity: number}>;
  invalidItems: Array<{id: string, product_id: string, quantity: number, availableStock: number}>;
}> => {
  try {
    console.log(`[stockChecker] Validating all items in cart: ${cartId}`);
    
    // Get all items in cart
    const { data: cartItems, error: cartItemsError } = await supabase
      .from('cart_items')
      .select(`
        id, 
        product_id,
        quantity
      `)
      .eq('cart_id', cartId);
      
    if (cartItemsError) {
      console.error('Error fetching cart items:', cartItemsError);
      return { validItems: [], invalidItems: [] };
    }
    
    if (!cartItems || cartItems.length === 0) {
      console.log('No items in cart to validate');
      return { validItems: [], invalidItems: [] };
    }
    
    const validItems: Array<{id: string, product_id: string, quantity: number}> = [];
    const invalidItems: Array<{id: string, product_id: string, quantity: number, availableStock: number}> = [];
    
    // Get product IDs to fetch in a single query
    const productIds = cartItems.map(item => item.product_id);
    
    // Fetch all products at once
    const { data: products, error: productsError } = await supabase
      .from('produtos')
      .select('id, estoque')
      .in('id', productIds);
      
    if (productsError || !products) {
      console.error('Error fetching products for stock validation:', productsError);
      return { validItems: [], invalidItems: [] };
    }
    
    // Create a map for quick lookup
    const productStockMap = new Map();
    products.forEach(product => {
      productStockMap.set(product.id, product.estoque);
    });
    
    // Validate each cart item
    for (const item of cartItems) {
      const availableStock = productStockMap.get(item.product_id) || 0;
      
      if (availableStock >= item.quantity) {
        validItems.push(item);
      } else {
        invalidItems.push({
          ...item,
          availableStock
        });
      }
    }
    
    console.log(`[stockChecker] Validation results:`, {
      validItems: validItems.length,
      invalidItems: invalidItems.length
    });
    
    return { validItems, invalidItems };
  } catch (error) {
    console.error('Error validating cart items stock:', error);
    return { validItems: [], invalidItems: [] };
  }
};
