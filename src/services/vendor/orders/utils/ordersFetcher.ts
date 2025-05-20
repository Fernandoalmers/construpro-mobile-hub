
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder, OrderFilters } from '../types';
import { fetchCustomerInfo } from './clientInfoFetcher';
import { fetchProductsForItems } from './productFetcher';

/**
 * Fetches order items for a specific order ID, including product information
 * 
 * @param orderId The ID of the order
 * @returns Promise resolving to an array of order items
 */
export const fetchOrderItemsForOrder = async (orderId: string): Promise<OrderItem[]> => {
  if (!orderId) {
    console.log('⚠️ [fetchOrderItemsForOrder] No order ID provided');
    return [];
  }
  
  try {
    console.log(`🔍 [fetchOrderItemsForOrder] Fetching items for order: ${orderId}`);
    
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        created_at
      `)
      .eq('order_id', orderId);
      
    if (orderItemsError) {
      console.error('🚫 [fetchOrderItemsForOrder] Error fetching order items:', orderItemsError);
      return [];
    }
    
    if (!orderItemsData || orderItemsData.length === 0) {
      console.log(`⚠️ [fetchOrderItemsForOrder] No items found for order: ${orderId}`);
      return [];
    }
    
    console.log(`✅ [fetchOrderItemsForOrder] Found ${orderItemsData.length} items for order ${orderId}`);
    
    // Fetch product details for all items
    const productIds = orderItemsData.map(item => item.produto_id).filter(Boolean);
    const productMap = await fetchProductsForItems(productIds);
    
    // Map order items with product details
    const orderItems: OrderItem[] = orderItemsData.map(item => ({
      id: item.id,
      order_id: item.order_id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal || 0,
      total: item.subtotal || (item.quantidade * item.preco_unitario) || 0,
      created_at: item.created_at,
      produto: productMap[item.produto_id] || null
    }));
    
    return orderItems;
  } catch (error) {
    console.error('🚫 [fetchOrderItemsForOrder] Error:', error);
    return [];
  }
};

/**
 * Fetches orders that are associated with a vendor by checking order_items and produtos tables
 * 
 * @param vendorId The ID of the vendor
 * @param filters Optional filters for the orders
 * @returns Promise resolving to an array of vendor orders
 */
export const fetchDirectVendorOrders = async (
  vendorId: string,
  filters?: OrderFilters
): Promise<VendorOrder[]> => {
  try {
    console.log(`🔍 [fetchDirectVendorOrders] Fetching orders for vendor ID: ${vendorId}`);
    
    if (!vendorId) {
      console.error('🚫 [fetchDirectVendorOrders] Vendor ID is required');
      return [];
    }
    
    // First, we need to get products that belong to this vendor
    const { data: vendorProducts, error: vendorProductsError } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorId);
      
    if (vendorProductsError) {
      console.error('🚫 [fetchDirectVendorOrders] Error fetching vendor products:', vendorProductsError);
      return [];
    }
    
    if (!vendorProducts || vendorProducts.length === 0) {
      console.log('⚠️ [fetchDirectVendorOrders] No products found for vendor:', vendorId);
      return [];
    }
    
    const vendorProductIds = vendorProducts.map(product => product.id);
    console.log(`✅ [fetchDirectVendorOrders] Found ${vendorProductIds.length} products for vendor ${vendorId}`);
    
    // Find order_items that contain the vendor's products
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .in('produto_id', vendorProductIds);
      
    if (orderItemsError) {
      console.error('🚫 [fetchDirectVendorOrders] Error fetching order items:', orderItemsError);
      return [];
    }
    
    if (!orderItemsData || orderItemsData.length === 0) {
      console.log('⚠️ [fetchDirectVendorOrders] No orders found containing this vendor\'s products');
      return [];
    }
    
    // Get unique order IDs
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
    console.log(`✅ [fetchDirectVendorOrders] Found ${orderIds.length} orders containing vendor's products`);
    
    // Fetch full order details from the orders table
    let query = supabase
      .from('orders')
      .select(`
        id, 
        cliente_id,
        valor_total,
        status,
        forma_pagamento,
        endereco_entrega,
        created_at,
        updated_at,
        pontos_ganhos,
        rastreio
      `)
      .in('id', orderIds);
      
    // Apply filters if provided
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
    }
    
    // Sort by creation date, newest first
    query = query.order('created_at', { ascending: false });
    
    const { data: ordersData, error: ordersError } = await query;
    
    if (ordersError) {
      console.error('🚫 [fetchDirectVendorOrders] Error fetching orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('⚠️ [fetchDirectVendorOrders] No orders found from orders table for the identified order IDs');
      return [];
    }
    
    console.log(`✅ [fetchDirectVendorOrders] Found ${ordersData.length} orders for vendor ${vendorId}`);
    
    // Process each order and fetch related data
    const vendorOrders: VendorOrder[] = [];
    
    for (const order of ordersData) {
      try {
        // Fetch customer information using cliente_id
        const clienteInfo = await fetchCustomerInfo(order.cliente_id, vendorId);
        
        // Fetch order items for this order
        const orderItems = await fetchOrderItemsForOrder(order.id);
        
        // Filter order items to only include this vendor's products
        const vendorOrderItems = orderItems.filter(item => 
          vendorProductIds.includes(item.produto_id)
        );
        
        // Skip this order if none of the items belong to this vendor
        if (vendorOrderItems.length === 0) {
          continue;
        }
        
        // Calculate subtotal for just this vendor's items
        const vendorSubtotal = vendorOrderItems.reduce((sum, item) => 
          sum + (item.subtotal || (item.quantidade * item.preco_unitario) || 0), 0);
        
        // Create vendor order object with all required information
        vendorOrders.push({
          id: order.id,
          vendedor_id: vendorId, // Add vendor ID reference
          cliente_id: order.cliente_id,
          valor_total: vendorSubtotal, // Use subtotal of just this vendor's items
          status: order.status || 'Pendente',
          forma_pagamento: order.forma_pagamento || 'Não especificado',
          endereco_entrega: order.endereco_entrega,
          created_at: order.created_at || new Date().toISOString(),
          data_entrega_estimada: null, // Not available in orders table
          pontos_ganhos: order.pontos_ganhos || 0,
          rastreio: order.rastreio,
          cliente: clienteInfo,
          itens: vendorOrderItems
        });
      } catch (err) {
        console.error('🚫 [fetchDirectVendorOrders] Error processing order:', order.id, err);
      }
    }
    
    console.log(`📦 [fetchDirectVendorOrders] Successfully processed ${vendorOrders.length} vendor orders`);
    return vendorOrders;
    
  } catch (error) {
    console.error('🚫 [fetchDirectVendorOrders] Unexpected error:', error);
    return [];
  }
};

/**
 * Fetches orders by ID
 * 
 * @param orderIds Array of order IDs to fetch
 * @returns Promise resolving to an array of orders
 */
export const fetchOrdersById = async (orderIds: string[]): Promise<any[]> => {
  if (!orderIds || !orderIds.length) {
    console.warn('📝 [fetchOrdersById] No order IDs provided.');
    return [];
  }
  
  try {
    console.log(`📝 [fetchOrdersById] Fetching ${orderIds.length} orders by IDs.`);
    
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
        updated_at,
        pontos_ganhos,
        rastreio
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('🚫 [fetchOrdersById] Error fetching orders by ID:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('⚠️ [fetchOrdersById] No orders found matching the provided IDs.');
      return [];
    }
    
    console.log(`✅ [fetchOrdersById] Successfully fetched ${ordersData.length} orders.`);
    return ordersData;
  } catch (error) {
    console.error('🚫 [fetchOrdersById] Unexpected error:', error);
    return [];
  }
};

// Function to get product IDs belonging to a vendor
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  try {
    if (!vendorId) {
      return [];
    }
    
    const { data: products, error } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorId);
      
    if (error || !products) {
      console.error('Error fetching vendor products:', error);
      return [];
    }
    
    return products.map(product => product.id);
  } catch (error) {
    console.error('Error in getVendorProductIds:', error);
    return [];
  }
};
