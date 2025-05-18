import { supabase } from '@/integrations/supabase/client';
import { SimpleOrderItem } from './orderItemTypes';
import { ProductData } from './productTypes';
import { fetchProductsForItems, getVendorProductIds } from './productFetcher';

// Fetch order items with improved logging and error handling
export const fetchOrderItemsForProducts = async (productIds: string[]): Promise<Array<Record<string, unknown>>> => {
  if (!productIds.length) return [];
  
  try {
    console.log(`Fetching order items for ${productIds.length} product IDs`);
    console.log(`Product IDs: ${JSON.stringify(productIds.slice(0, 5))}${productIds.length > 5 ? '... (and more)' : ''}`);
    
    // Use explicit query with better logging
    const result = await supabase
      .from('order_items')
      .select('id, order_id, produto_id, quantidade, preco_unitario, subtotal, created_at')
      .in('produto_id', productIds);
    
    if (result.error) {
      console.error('Error fetching order items:', result.error);
      return [];
    }
    
    // Log raw response for debugging
    console.log(`Raw order items response: ${result.data ? result.data.length : 0} items found`);
    if (result.data && result.data.length > 0) {
      console.log('Sample order item:', JSON.stringify(result.data[0]));
    } else {
      console.log('No order items found for the specified products');
      
      // Diagnostic: Check if we can find any order items at all 
      const allItemsResult = await supabase
        .from('order_items')
        .select('count')
        .limit(1);
        
      if (allItemsResult.error) {
        console.error('Error checking order_items table:', allItemsResult.error);
      } else {
        console.log(`Total order_items in database: ${allItemsResult.count || 'unknown'}`);
      }
      
      // Diagnostic: Check if the product IDs exist in the database
      const productCheckResult = await supabase
        .from('order_items')
        .select('produto_id, count')
        .in('produto_id', productIds.slice(0, 10));
        
      if (productCheckResult.error) {
        console.error('Error checking product presence in order_items:', productCheckResult.error);
      } else if (productCheckResult.data) {
        console.log('Product presence in order_items:', productCheckResult.data);
      }
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

// Create a map of order items with improved product loading
export const createOrderItemsMap = (
  orderItemsData: Array<Record<string, unknown>>, 
  productMap: Record<string, ProductData>
): Record<string, SimpleOrderItem[]> => {
  const orderItemsMap: Record<string, SimpleOrderItem[]> = {};
  
  console.log(`Creating order items map from ${orderItemsData.length} items`);
  console.log(`Product map has ${Object.keys(productMap).length} products`);
  
  // Check for missing product mapping
  const missingProducts = new Set<string>();
  
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
    
    // Get product data and track missing products
    const produto = productMap[produtoId] || null;
    if (!produto && produtoId) {
      missingProducts.add(produtoId);
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
  
  // Log missing products for debugging
  if (missingProducts.size > 0) {
    console.warn(`Found ${missingProducts.size} product IDs with no product data`);
    console.warn('First few missing product IDs:', Array.from(missingProducts).slice(0, 5));
    
    // We should fetch these missing products separately for a complete order view
    // This could indicate a synchronization issue between order_items and produtos tables
  }
  
  return orderItemsMap;
};

// Add a new diagnostic function to check all connections
export const diagnoseBrokenConnections = async (vendorId: string): Promise<{
  vendorExists: boolean;
  productCount: number;
  orderItemsCount: number;
  orderIds: string[];
}> => {
  console.log(`Running connection diagnostics for vendor: ${vendorId}`);
  
  try {
    // 1. Check if vendor exists
    const vendorResult = await supabase
      .from('vendedores')
      .select('nome_loja')
      .eq('id', vendorId)
      .single();
      
    const vendorExists = !vendorResult.error;
    console.log(`Vendor exists: ${vendorExists}${vendorExists ? ' - ' + vendorResult.data?.nome_loja : ''}`);
    
    // 2. Get vendor products
    const productIds = await getVendorProductIds(vendorId);
    console.log(`Found ${productIds.length} products for vendor`);
    
    // 3. Find order items for these products
    const orderItemsResult = await supabase
      .from('order_items')
      .select('id, order_id, produto_id')
      .in('produto_id', productIds.length > 0 ? productIds.slice(0, 50) : ['no-products']);
      
    const orderItemsCount = orderItemsResult.data?.length || 0;
    console.log(`Found ${orderItemsCount} order items with vendor products`);
    
    // 4. Get unique order IDs
    const orderIds = orderItemsResult.data ? 
      [...new Set(orderItemsResult.data.map(item => item.order_id))] : [];
    console.log(`Found ${orderIds.length} unique orders with vendor products`);
    
    return {
      vendorExists,
      productCount: productIds.length,
      orderItemsCount,
      orderIds: orderIds
    };
  } catch (error) {
    console.error('Error in connection diagnostics:', error);
    return {
      vendorExists: false,
      productCount: 0,
      orderItemsCount: 0,
      orderIds: []
    };
  }
};

// Re-export from productFetcher for backward compatibility
export { getVendorProductIds, fetchProductsForItems } from './productFetcher';
export type { ProductData, ProductImageType } from './productTypes';
export type { SimpleOrderItem } from './orderItemTypes';
