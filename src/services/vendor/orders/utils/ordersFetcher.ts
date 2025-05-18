
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder } from '../types';
import { fetchCustomerInfo } from './clientInfoFetcher';
import { VendorCustomer } from '../../../vendorCustomersService';
import {
  fetchOrderItemsForProducts,
  getVendorProductIds,
  createOrderItemsMap
} from './orderItemsFetcher';

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
      } catch (err) {
        console.error('Error processing order:', order.id, err);
      }
    } else {
      console.warn(`Order ${order.id} has no items for vendor ${vendorId}`);
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
    const orderItemsData = await fetchOrderItemsForProducts(productIds);
    if (!orderItemsData.length) {
      console.log('No order items found for vendor products');
      return [];
    }
    
    // Get unique order IDs from order items
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id as string))];
    console.log(`Found ${orderIds.length} unique orders containing vendor products`);
    
    // Fetch full orders data
    const ordersData = await fetchOrdersById(orderIds);
    if (!ordersData.length) {
      console.log('Failed to fetch order data');
      return [];
    }
    
    // Group order items by order ID
    const orderItemsMap = createOrderItemsMap(orderItemsData, {});
    
    // Process vendor-specific orders
    const vendorOrders = await processVendorOrdersFromOrderItems(
      ordersData,
      orderItemsMap,
      vendorId
    );
    
    return vendorOrders;
  } catch (error) {
    console.error('Error in fetchOrdersFromOrderItems:', error);
    return [];
  }
};
