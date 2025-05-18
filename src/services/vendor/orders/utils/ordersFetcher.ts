
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder } from '../types';
import { fetchCustomerInfo } from './clientInfoFetcher';
import { fetchProductsForItems } from './productFetcher';
import { getVendorProductIds } from './productFetcher';

// Re-export getVendorProductIds from productFetcher
export { getVendorProductIds } from './productFetcher';

// Helper to get orders from the pedidos table (old structure)
export const fetchOrdersFromPedidos = async (vendorId: string): Promise<VendorOrder[]> => {
  console.log('Fetching orders from pedidos table for vendor:', vendorId);
  
  try {
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('vendedor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (pedidosError) {
      console.error('Error fetching vendor orders from pedidos:', pedidosError);
      return [];
    }
    
    if (!pedidosData || pedidosData.length === 0) {
      console.log('No orders found in pedidos table');
      return [];
    }
    
    console.log('Found', pedidosData.length, 'orders in pedidos table');
    
    // Process and return orders from pedidos
    const orders: VendorOrder[] = [];
    
    for (const pedido of pedidosData) {
      try {
        // Get cliente info
        const clienteInfo = await fetchCustomerInfo(pedido.usuario_id, vendorId);
        
        // Get items for this pedido
        const { data: itemsData, error: itemsError } = await supabase
          .from('itens_pedido')
          .select(`
            *,
            produto:produto_id (*)
          `)
          .eq('pedido_id', pedido.id);
        
        if (itemsError) {
          console.error('Error fetching pedido items:', itemsError);
        }
        
        // Convert items
        const convertedItems: OrderItem[] = (itemsData || []).map(item => ({
          id: item.id,
          pedido_id: item.pedido_id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          total: item.total || (item.preco_unitario * item.quantidade),
          subtotal: item.total,
          produto: item.produto
        }));
        
        orders.push({
          id: pedido.id,
          vendedor_id: pedido.vendedor_id,
          usuario_id: pedido.usuario_id,
          valor_total: pedido.valor_total,
          status: pedido.status,
          forma_pagamento: pedido.forma_pagamento,
          endereco_entrega: pedido.endereco_entrega,
          created_at: pedido.created_at,
          data_entrega_estimada: pedido.data_entrega_estimada,
          cliente: clienteInfo,
          itens: convertedItems
        });
      } catch (err) {
        console.error('Error processing pedido:', pedido.id, err);
      }
    }
    
    return orders;
  } catch (mainError) {
    console.error('Unexpected error in fetchOrdersFromPedidos:', mainError);
    return [];
  }
};

// Fetch orders based on their IDs
export const fetchOrdersById = async (orderIds: string[]): Promise<any[]> => {
  if (!orderIds.length) return [];
  
  try {
    console.log(`Fetching ${orderIds.length} orders by IDs`);
    console.log('Order IDs sample:', orderIds.slice(0, 3));
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, 
        cliente_id, 
        valor_total,
        status,
        forma_pagamento,
        endereco_entrega,
        created_at,
        updated_at
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders by ID:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found matching the provided IDs');
      return [];
    }
    
    console.log(`Successfully fetched ${ordersData.length} orders out of ${orderIds.length} requested`);
    console.log('Sample order:', ordersData[0]);
    
    return ordersData;
  } catch (error) {
    console.error('Error fetching orders by ID:', error);
    return [];
  }
};

// Calculate the vendor's portion of an order
export const calculateVendorOrderTotal = (vendorItems: OrderItem[]): number => {
  return vendorItems.reduce((sum, item) => {
    const itemTotal = Number(item.total || item.subtotal || (item.quantidade * item.preco_unitario) || 0);
    return sum + itemTotal;
  }, 0);
};

// Process orders from the order_items table
export const processVendorOrdersFromOrderItems = async (
  ordersData: any[], 
  orderItemsMap: Record<string, OrderItem[]>, 
  vendorId: string
): Promise<VendorOrder[]> => {
  const vendorOrders: VendorOrder[] = [];
  
  console.log(`Processing ${ordersData.length} orders for vendor ${vendorId}`);
  console.log(`Order items map has keys for ${Object.keys(orderItemsMap).length} orders`);
  
  // Generate debug data
  const orderItemMapDebug = Object.keys(orderItemsMap).map(orderId => ({
    orderId,
    itemCount: orderItemsMap[orderId]?.length || 0
  }));
  console.log('Order items map debug sample:', orderItemMapDebug.slice(0, 3));
  
  const matchingOrderIds = ordersData.map(o => o.id).filter(id => orderItemsMap[id]);
  console.log(`Found ${matchingOrderIds.length} matching order IDs between ordersData and orderItemsMap`);
  
  for (const order of ordersData) {
    // Get vendor items for this order
    const vendorItems = orderItemsMap[order.id] || [];
    
    if (vendorItems.length > 0) {
      try {
        // Get client profile
        const clienteInfo = await fetchCustomerInfo(order.cliente_id, vendorId);
        
        // Calculate vendor's portion of the order
        const vendorTotal = calculateVendorOrderTotal(vendorItems);
        
        // Create vendor order with explicit properties
        const vendorOrder: VendorOrder = {
          id: order.id,
          cliente_id: order.cliente_id,
          valor_total: vendorTotal,
          status: order.status || 'pendente',
          forma_pagamento: order.forma_pagamento || 'Não especificado',
          endereco_entrega: order.endereco_entrega,
          created_at: order.created_at || new Date().toISOString(),
          cliente: clienteInfo,
          itens: vendorItems
        };
        
        vendorOrders.push(vendorOrder);
        console.log(`Added order ${order.id} to vendor orders`);
      } catch (err) {
        console.error('Error processing order:', order.id, err);
      }
    } else {
      console.log(`Order ${order.id} has no items for vendor ${vendorId}, skipping`);
    }
  }
  
  console.log(`Processed ${vendorOrders.length} vendor orders successfully`);
  
  return vendorOrders;
};

// Function to fetch orders from order_items through associated products
export const fetchOrdersFromOrderItems = async (
  vendorId: string,
  productIds: string[]
): Promise<VendorOrder[]> => {
  if (!productIds.length) {
    console.log('No product IDs provided for fetchOrdersFromOrderItems');
    return [];
  }
  
  try {
    console.log(`Fetching orders from order_items for ${productIds.length} products`);
    
    // Get all order items containing vendor products
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, order_id, produto_id, quantidade, preco_unitario, subtotal, created_at')
      .in('produto_id', productIds);
      
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return [];
    }
    
    if (!orderItemsData || orderItemsData.length === 0) {
      console.log('No order items found for vendor products');
      
      // Emergency debug query
      const { data: debugItems, error: debugError } = await supabase
        .from('order_items')
        .select('count')
        .limit(1);
        
      if (debugError) {
        console.error('Debug query error:', debugError);
      } else {
        console.log('Debug query result:', debugItems);
      }
      
      return [];
    }
    
    console.log(`Found ${orderItemsData.length} order items for vendor products`);
    
    // Get unique order IDs from order items
    const orderIds: string[] = [...new Set(orderItemsData.map(item => item.order_id).filter(Boolean) as string[])];
    console.log(`Found ${orderIds.length} unique orders containing vendor products`);
    
    // Fetch full orders data
    const ordersData = await fetchOrdersById(orderIds);
    if (!ordersData.length) {
      console.log('Failed to fetch order data');
      return [];
    }
    
    // Fetch products data for order items
    const productIdsInItems = [...new Set(orderItemsData.map(item => item.produto_id).filter(Boolean) as string[])];
    const productMap = await fetchProductsForItems(productIdsInItems);
    
    // Group order items by order ID with product data
    const orderItemsMap: Record<string, OrderItem[]> = {};
    
    for (const item of orderItemsData) {
      if (item.order_id) {
        if (!orderItemsMap[item.order_id]) {
          orderItemsMap[item.order_id] = [];
        }
        
        // Get product data if available
        const produto = productMap[item.produto_id] || null;
        
        orderItemsMap[item.order_id].push({
          id: item.id,
          order_id: item.order_id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal || 0,
          total: item.subtotal || (item.quantidade * item.preco_unitario) || 0,
          produto: produto,
          created_at: item.created_at
        });
      }
    }
    
    // Process vendor-specific orders
    const vendorOrders = await processVendorOrdersFromOrderItems(
      ordersData,
      orderItemsMap,
      vendorId
    );
    
    console.log(`Returning ${vendorOrders.length} vendor orders`);
    return vendorOrders;
  } catch (error) {
    console.error('Error in fetchOrdersFromOrderItems:', error);
    return [];
  }
};
