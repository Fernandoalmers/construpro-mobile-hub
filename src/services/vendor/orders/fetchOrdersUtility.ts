
import { supabase } from '@/integrations/supabase/client';
import { VendorOrder } from './types';
import { getVendorProductIds, fetchOrderItemsForProducts, fetchProductsForItems, createOrderItemsMap } from './utils/orderItemsFetcher';
import { getVendorCustomer } from '@/services/vendorCustomersService';
import { logDiagnosticInfo } from './utils/diagnosticUtils';

// Fetch orders from the pedidos table (direct vendor relationship)
export const fetchOrdersFromPedidos = async (vendorId: string): Promise<VendorOrder[]> => {
  console.log('Fetching orders from pedidos table for vendor:', vendorId);
  
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('vendedor_id', vendorId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching orders from pedidos:', error);
    return [];
  }
  
  if (!data || data.length === 0) {
    console.log('No orders found in pedidos table');
    return [];
  }
  
  console.log(`Found ${data.length} orders in pedidos table`);
  
  // Process orders and load customer information
  const processedOrders: VendorOrder[] = [];
  
  for (const order of data) {
    // Fetch customer info if available
    let customer = null;
    if (order.usuario_id) {
      customer = await getVendorCustomer(order.usuario_id);
    }
    
    const vendorOrder: VendorOrder = {
      id: order.id,
      vendedor_id: order.vendedor_id,
      usuario_id: order.usuario_id,
      cliente_id: order.usuario_id,
      valor_total: order.valor_total,
      status: order.status,
      forma_pagamento: order.forma_pagamento,
      endereco_entrega: order.endereco_entrega,
      created_at: order.created_at,
      data_entrega_estimada: order.data_entrega_estimada,
      cliente: customer,
      itens: [] // Will be filled later if needed
    };
    
    processedOrders.push(vendorOrder);
  }
  
  return processedOrders;
};

// Fetch orders from order_items (indirect relationship through products)
export const fetchOrdersFromOrderItems = async (vendorId: string, productIds: string[]): Promise<VendorOrder[]> => {
  if (!productIds.length) {
    console.log('No product IDs provided to fetch order items');
    return [];
  }
  
  console.log(`Fetching orders via order_items for ${productIds.length} products`);
  
  try {
    // 1. Get all order items for the vendor's products
    const orderItemsData = await fetchOrderItemsForProducts(productIds);
    
    // If no order items found, exit early
    if (!orderItemsData.length) {
      return [];
    }
    
    // 2. Extract unique order IDs
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id as string))];
    console.log(`Found ${orderIds.length} unique orders containing vendor products`);
    
    // 3. Fetch products details for these order items
    const productMap = await fetchProductsForItems(productIds);
    
    // 4. Create a map of order items grouped by order
    const orderItemsMap = createOrderItemsMap(orderItemsData, productMap);
    
    // 5. Fetch the actual orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('id', orderIds)
      .order('created_at', { ascending: false });
      
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found matching the order items');
      return [];
    }
    
    console.log(`Found ${ordersData.length} orders from order items`);
    
    // 6. Process orders and add their items
    const processedOrders: VendorOrder[] = [];
    
    for (const order of ordersData) {
      // Fetch customer info if available
      let customer = null;
      if (order.cliente_id) {
        customer = await getVendorCustomer(order.cliente_id);
      }
      
      const vendorOrder: VendorOrder = {
        id: order.id,
        vendedor_id: vendorId, // This is the vendor we're searching for
        usuario_id: order.cliente_id,
        cliente_id: order.cliente_id,
        valor_total: order.valor_total,
        status: order.status,
        forma_pagamento: order.forma_pagamento,
        endereco_entrega: order.endereco_entrega,
        created_at: order.created_at,
        data_entrega_estimada: null, // May not be available in orders table
        cliente: customer,
        itens: orderItemsMap[order.id] || []
      };
      
      processedOrders.push(vendorOrder);
    }
    
    return processedOrders;
  } catch (error) {
    console.error('Error fetching orders via order items:', error);
    return [];
  }
};

export { getVendorProductIds, logDiagnosticInfo };
