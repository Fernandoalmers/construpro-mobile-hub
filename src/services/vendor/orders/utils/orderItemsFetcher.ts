
import { supabase } from '@/integrations/supabase/client';
import { SimpleOrderItem } from './orderItemTypes';
import { ProductData } from './productTypes';
import { fetchProductsForItems, getVendorProductIds } from './productFetcher';

// Fetch order items
export const fetchOrderItemsForProducts = async (productIds: string[]): Promise<Array<Record<string, unknown>>> => {
  if (!productIds.length) return [];
  
  try {
    console.log(`Fetching order items for ${productIds.length} product IDs`);
    
    const result = await supabase
      .from('order_items')
      .select('id, order_id, produto_id, quantidade, preco_unitario, subtotal, created_at')
      .in('produto_id', productIds);
    
    if (result.error) {
      console.error('Error fetching order items:', result.error);
      return [];
    }
    
    // Use simple inline type assertion without complex nesting
    const orderItemsData = result.data as { 
      id: string;
      order_id: string;
      produto_id: string;
      quantidade: number;
      preco_unitario: number;
      subtotal: number;
      created_at?: string;
    }[] || [];
    
    if (orderItemsData.length === 0) {
      console.log('No order items found for vendor products');
      return [];
    }
    
    console.log(`Found ${orderItemsData.length} order items for vendor products`);
    
    // Extract unique order IDs for diagnostics
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
    console.log(`Found ${orderIds.length} unique orders containing vendor products`);
    
    // Return as the expected type
    return orderItemsData as Array<Record<string, unknown>>;
  } catch (error) {
    console.error('Error fetching order items:', error);
    return [];
  }
};

// Create a map of order items
export const createOrderItemsMap = (
  orderItemsData: Array<Record<string, unknown>>, 
  productMap: Record<string, ProductData>
): Record<string, SimpleOrderItem[]> => {
  const orderItemsMap: Record<string, SimpleOrderItem[]> = {};
  
  console.log(`Creating order items map from ${orderItemsData.length} items`);
  
  orderItemsData.forEach(item => {
    // Validate required fields
    const orderId = item.order_id as string;
    const produtoId = item.produto_id as string;
    
    if (!orderId) {
      console.warn('Order item missing order_id:', item);
      return;
    }
    
    if (!orderItemsMap[orderId]) {
      orderItemsMap[orderId] = [];
    }
    
    // Get product data
    const produto = productMap[produtoId] || null;
    
    // Handle missing product gracefully
    if (!produto) {
      console.warn(`Product not found for order item, product ID: ${produtoId}`);
    }
    
    // Create order item with explicit properties
    const orderItem: SimpleOrderItem = {
      id: item.id as string,
      order_id: orderId,
      produto_id: produtoId,
      quantidade: item.quantidade as number,
      preco_unitario: item.preco_unitario as number,
      subtotal: (item.subtotal as number) || 0,
      total: (item.subtotal as number) || ((item.quantidade as number) * (item.preco_unitario as number)) || 0,
      produto: produto,
      created_at: item.created_at as string | undefined
    };
    
    orderItemsMap[orderId].push(orderItem);
  });
  
  console.log(`Created order items map with ${Object.keys(orderItemsMap).length} unique orders`);
  
  return orderItemsMap;
};

// Re-export from productFetcher for backward compatibility
export { getVendorProductIds, fetchProductsForItems } from './productFetcher';
export type { ProductData, ProductImageType } from './productTypes';
export type { SimpleOrderItem } from './orderItemTypes';
