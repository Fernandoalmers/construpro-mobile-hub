
import { supabase } from '@/integrations/supabase/client';
import { OrderItem } from '../types';

// Helper to get vendor product IDs with improved error handling
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  try {
    console.log('Getting product IDs for vendor:', vendorId);
    
    // Get all produtos owned by this vendor
    const { data: vendorProducts, error: productsError } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorId);
    
    if (productsError) {
      console.error('Error fetching vendor products:', productsError);
      return [];
    }
    
    if (!vendorProducts || vendorProducts.length === 0) {
      console.log('No products found for vendor');
      
      // Try alternate product table as backup
      const { data: altProducts, error: altError } = await supabase
        .from('products') // Alternative product table that might be used
        .select('id')
        .eq('vendedor_id', vendorId);
        
      if (altError || !altProducts || altProducts.length === 0) {
        console.log('No products found in alternate table either');
        return [];
      }
      
      console.log(`Found ${altProducts.length} products in alternate table`);
      return altProducts.map(p => p.id);
    }
    
    console.log(`Found ${vendorProducts.length} products for this vendor`);
    return vendorProducts.map(p => p.id);
  } catch (error) {
    console.error('Unexpected error in getVendorProductIds:', error);
    return [];
  }
};

// Fetch product data for a list of product IDs
export const fetchProductsForItems = async (productIds: string[]): Promise<Record<string, any>> => {
  try {
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, nome, descricao, preco_normal, imagens')
      .in('id', productIds);
    
    const productMap: Record<string, any> = {};
    if (produtos) {
      produtos.forEach(product => {
        productMap[product.id] = product;
      });
    }
    
    return productMap;
  } catch (error) {
    console.error('Error fetching products for items:', error);
    return {};
  }
};

// Process order items with explicit type definition to avoid deep nesting
export const createOrderItemsMap = (
  orderItemsData: any[], 
  productMap: Record<string, any>
): Record<string, OrderItem[]> => {
  const orderItemsMap: Record<string, OrderItem[]> = {};
  
  orderItemsData.forEach(item => {
    if (!orderItemsMap[item.order_id]) {
      orderItemsMap[item.order_id] = [];
    }
    
    // Create order item with explicit properties to avoid circular references
    const orderItem: OrderItem = {
      id: item.id,
      order_id: item.order_id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
      total: item.subtotal || (item.quantidade * item.preco_unitario) || 0,
      // Set optional fields explicitly to avoid deep nesting
      pedido_id: undefined,
      produto: productMap[item.produto_id] || null,
      produtos: null // Set to null instead of duplicating product reference
    };
    
    orderItemsMap[item.order_id].push(orderItem);
  });
  
  return orderItemsMap;
};

// Fetch order items for a list of product IDs
export const fetchOrderItemsForProducts = async (productIds: string[]): Promise<any[]> => {
  if (!productIds.length) return [];
  
  try {
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, order_id, produto_id, quantidade, preco_unitario, subtotal')
      .in('produto_id', productIds);
    
    if (orderItemsError || !orderItemsData) {
      console.log('Error or no order items found for vendor products');
      return [];
    }
    
    return orderItemsData;
  } catch (error) {
    console.error('Error fetching order items:', error);
    return [];
  }
};
