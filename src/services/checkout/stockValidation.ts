
import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/types/cart";

export interface StockValidationResult {
  isValid: boolean;
  invalidItems: {
    itemId: string;
    productId: string;
    requestedQuantity: number;
    availableStock: number;
    productName: string;
  }[];
  adjustedItems: {
    itemId: string;
    productId: string;
    oldQuantity: number;
    newQuantity: number;
    productName: string;
  }[];
}

/**
 * Validates stock availability for all items in cart before checkout
 */
export const validateCartStock = async (cartItems: CartItem[]): Promise<StockValidationResult> => {
  console.log('[stockValidation] Validating stock for', cartItems.length, 'items');
  
  const invalidItems: StockValidationResult['invalidItems'] = [];
  const adjustedItems: StockValidationResult['adjustedItems'] = [];
  
  for (const item of cartItems) {
    if (!item.produto_id) {
      console.warn('[stockValidation] Item missing produto_id:', item);
      continue;
    }
    
    try {
      // Get current stock for this product
      const { data: product, error } = await supabase
        .from('produtos')
        .select('id, nome, estoque')
        .eq('id', item.produto_id)
        .single();
        
      if (error || !product) {
        console.error('[stockValidation] Error fetching product:', error);
        invalidItems.push({
          itemId: item.id,
          productId: item.produto_id,
          requestedQuantity: item.quantidade,
          availableStock: 0,
          productName: item.produto?.nome || 'Produto não encontrado'
        });
        continue;
      }
      
      const requestedQuantity = item.quantidade || 1;
      const availableStock = product.estoque || 0;
      
      if (availableStock === 0) {
        // Product is out of stock
        invalidItems.push({
          itemId: item.id,
          productId: item.produto_id,
          requestedQuantity,
          availableStock: 0,
          productName: product.nome
        });
      } else if (availableStock < requestedQuantity) {
        // Stock insufficient, but some available
        adjustedItems.push({
          itemId: item.id,
          productId: item.produto_id,
          oldQuantity: requestedQuantity,
          newQuantity: availableStock,
          productName: product.nome
        });
      }
      
    } catch (error) {
      console.error('[stockValidation] Error validating item:', error);
      invalidItems.push({
        itemId: item.id,
        productId: item.produto_id,
        requestedQuantity: item.quantidade,
        availableStock: 0,
        productName: item.produto?.nome || 'Erro ao verificar produto'
      });
    }
  }
  
  const isValid = invalidItems.length === 0;
  
  console.log('[stockValidation] Validation complete:', {
    isValid,
    invalidItems: invalidItems.length,
    adjustedItems: adjustedItems.length
  });
  
  return {
    isValid,
    invalidItems,
    adjustedItems
  };
};

/**
 * Atomic stock validation and reservation for order processing
 */
export const validateAndReserveStock = async (cartItems: CartItem[]): Promise<{
  success: boolean;
  error?: string;
  failedItems?: string[];
}> => {
  try {
    console.log('[stockValidation] Starting atomic stock validation and reservation');
    
    // We'll use the order-processing edge function for this atomic operation
    // as it has the proper transaction handling
    const itemsToValidate = cartItems.map(item => ({
      produto_id: item.produto_id,
      quantidade: item.quantidade
    }));
    
    const { data, error } = await supabase.functions.invoke('order-processing', {
      body: {
        action: 'validate_stock',
        items: itemsToValidate
      }
    });
    
    if (error) {
      console.error('[stockValidation] Error in atomic validation:', error);
      return {
        success: false,
        error: 'Erro ao validar estoque: ' + error.message
      };
    }
    
    if (!data?.success) {
      console.warn('[stockValidation] Stock validation failed:', data);
      return {
        success: false,
        error: data?.error || 'Alguns produtos não têm estoque suficiente',
        failedItems: data?.failedItems || []
      };
    }
    
    console.log('[stockValidation] Atomic validation successful');
    return { success: true };
    
  } catch (error) {
    console.error('[stockValidation] Exception in atomic validation:', error);
    return {
      success: false,
      error: 'Erro interno ao validar estoque'
    };
  }
};
