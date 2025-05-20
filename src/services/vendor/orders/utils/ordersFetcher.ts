
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
 * Enhanced version of fetchDirectVendorOrders with detailed debugging
 * 
 * @param vendorId The ID of the vendor
 * @param filters Optional filters for the orders
 * @param debug Debug flag to include raw data in response
 * @returns Promise resolving to an array of vendor orders with debug info if requested
 */
export const fetchDirectVendorOrdersWithDebug = async (
  vendorId: string,
  filters?: OrderFilters,
  debug: boolean = true
): Promise<{orders: VendorOrder[], debug?: any}> => {
  try {
    console.log(`🔎 [fetchDirectVendorOrdersWithDebug] Starting enhanced fetch for vendor: ${vendorId}`);
    
    if (!vendorId) {
      console.error('🚫 [fetchDirectVendorOrdersWithDebug] Vendor ID is required');
      return {orders: [], debug: {error: 'Vendor ID is required'}};
    }

    // Get vendor profile first for more debugging info
    const { data: vendorProfile, error: vendorProfileError } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorProfileError) {
      console.error('🚫 [fetchDirectVendorOrdersWithDebug] Error fetching vendor profile:', vendorProfileError.message);
      return {orders: [], debug: {error: `Error fetching vendor profile: ${vendorProfileError.message}`, vendorId}};
    }
      
    // First, get all products belonging to this vendor for debugging
    const { data: vendorProducts, error: vendorProductsError } = await supabase
      .from('produtos')
      .select('id, nome, descricao, preco_normal, categoria, vendedor_id, status');
      
    if (vendorProductsError) {
      console.error('🚫 [fetchDirectVendorOrdersWithDebug] Error fetching vendor products:', vendorProductsError.message);
      return {orders: [], debug: {
        error: `Error fetching vendor products: ${vendorProductsError.message}`, 
        vendorId,
        vendorProfile
      }};
    }
    
    const debugInfo: any = {
      vendorId,
      timestamp: new Date().toISOString(),
      vendorProductsCount: vendorProducts?.filter(p => p.vendedor_id === vendorId).length || 0,
      vendorProductsSample: vendorProducts?.filter(p => p.vendedor_id === vendorId).slice(0, 3) || [],
      vendorProfile,
      vendorStatus: vendorProfile?.status || 'desconhecido',
      queriedTables: [],
      queries: [], // Add a new array to store query details
      tableInfo: {}
    };
    
    const vendorProductsList = vendorProducts?.filter(p => p.vendedor_id === vendorId) || [];
    
    if (!vendorProductsList || vendorProductsList.length === 0) {
      console.log('⚠️ [fetchDirectVendorOrdersWithDebug] No products found for vendor:', vendorId);
      debugInfo.error = 'No products found for vendor';
      
      // Check produtos table just to make sure
      const { count, error: countError } = await supabase
        .from('produtos')
        .select('*', { count: 'exact', head: true });
        
      if (!countError) {
        debugInfo.totalProductsInSystem = count || 0;
      }
      
      return {orders: [], debug: debugInfo};
    }
    
    const vendorProductIds = vendorProductsList.map(product => product.id);
    debugInfo.vendorProductIds = vendorProductIds.slice(0, 5).join(', ') + (vendorProductIds.length > 5 ? '...' : '');
    
    console.log(`✅ [fetchDirectVendorOrdersWithDebug] Found ${vendorProductIds.length} products for vendor ${vendorId}`);

    // Get info about tables for debugging
    const tablesToCheck = ['orders', 'order_items', 'produtos', 'pedidos'];
    for (const table of tablesToCheck) {
      try {
        // We need to use type assertion here to fix the TypeScript error
        // since we're using a variable which TypeScript can't narrow to a literal type
        const { count, error: countError } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true });
          
        if (!countError) {
          debugInfo.tableInfo[table] = { count: count || 0 };
          console.log(`ℹ️ [fetchDirectVendorOrdersWithDebug] Table ${table} has ${count} records`);
        }
      } catch (err) {
        console.log(`⚠️ [fetchDirectVendorOrdersWithDebug] Error checking table ${table}:`, err);
        debugInfo.tableInfo[table] = { error: String(err) };
      }
    }
    
    // Collect information about both order_items and itens_pedido tables
    let allOrderIdsFromItems: string[] = [];
    let filteringProcess: any = { steps: [] };
    
    // Query order_items that contain vendor's products - this is our primary table
    const orderItemsQuery = supabase
      .from('order_items')
      .select('order_id, produto_id, quantidade, preco_unitario, subtotal')
      .in('produto_id', vendorProductIds);
      
    debugInfo.queriedTables.push('order_items');
    debugInfo.queries.push({
      table: 'order_items',
      operation: 'select',
      filter: `produto_id IN [${vendorProductIds.slice(0, 3)}...]`,
      timestamp: new Date().toISOString()
    });
    
    const { data: orderItemsData, error: orderItemsError } = await orderItemsQuery;
    
    if (orderItemsError) {
      console.error('🚫 [fetchDirectVendorOrdersWithDebug] Error querying order_items:', orderItemsError.message);
      debugInfo.orderItemsError = orderItemsError.message;
      debugInfo.queries[debugInfo.queries.length - 1].error = orderItemsError.message;
      
      // If order_items fails, try the legacy table
      const { data: legacyItemsData, error: legacyItemsError } = await supabase
        .from('itens_pedido')
        .select('pedido_id, produto_id')
        .in('produto_id', vendorProductIds);
        
      debugInfo.queriedTables.push('itens_pedido');
      debugInfo.queries.push({
        table: 'itens_pedido',
        operation: 'select',
        filter: `produto_id IN [${vendorProductIds.slice(0, 3)}...]`,
        timestamp: new Date().toISOString()
      });
      
      if (legacyItemsError) {
        console.error('🚫 [fetchDirectVendorOrdersWithDebug] Error querying legacy itens_pedido:', legacyItemsError.message);
        debugInfo.legacyItemsError = legacyItemsError.message;
        debugInfo.queries[debugInfo.queries.length - 1].error = legacyItemsError.message;
      } else if (legacyItemsData && legacyItemsData.length > 0) {
        const legacyOrderIds = [...new Set(legacyItemsData.map(item => item.pedido_id))];
        debugInfo.legacyItemsCount = legacyItemsData.length;
        debugInfo.legacyOrderIds = legacyOrderIds.slice(0, 5);
        allOrderIdsFromItems = [...allOrderIdsFromItems, ...legacyOrderIds];
        
        filteringProcess.steps.push({
          source: 'itens_pedido',
          count: legacyItemsData.length,
          orderIdsFound: legacyOrderIds.length,
          sample: legacyItemsData.slice(0, 3)
        });
      } else {
        debugInfo.legacyItemsCount = 0;
      }
    } else if (orderItemsData && orderItemsData.length > 0) {
      debugInfo.orderItemsCount = orderItemsData.length;
      debugInfo.orderItemsSample = orderItemsData.slice(0, 5);
      
      // Get unique order IDs from order_items
      const orderIdsFromItems = [...new Set(orderItemsData.map(item => item.order_id))];
      allOrderIdsFromItems = [...allOrderIdsFromItems, ...orderIdsFromItems];
      
      filteringProcess.steps.push({
        source: 'order_items',
        count: orderItemsData.length,
        orderIdsFound: orderIdsFromItems.length,
        sample: orderItemsData.slice(0, 3)
      });
      
      console.log(`✅ [fetchDirectVendorOrdersWithDebug] Found ${orderIdsFromItems.length} order IDs in order_items`);
    } else {
      console.log('⚠️ [fetchDirectVendorOrdersWithDebug] No order items found containing vendor products');
      debugInfo.orderItemsCount = 0;
      filteringProcess.steps.push({
        source: 'order_items',
        count: 0,
        message: 'No order items found for vendor products'
      });
      
      // Additional diagnostics - check if ANY order_items exist
      const { count: totalOrderItemsCount, error: countError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true });
        
      if (!countError) {
        debugInfo.totalOrderItemsInSystem = totalOrderItemsCount || 0;
        console.log(`ℹ️ [fetchDirectVendorOrdersWithDebug] Total order_items in system: ${totalOrderItemsCount || 0}`);
      }
    }
    
    // Final list of all order ids from all item tables
    allOrderIdsFromItems = [...new Set(allOrderIdsFromItems)];
    debugInfo.allOrderIdsFromItems = allOrderIdsFromItems.slice(0, 10);
    debugInfo.totalOrderIdsFound = allOrderIdsFromItems.length;
    filteringProcess.orderIdsFound = allOrderIdsFromItems.length;
    
    // If no order IDs found, return early
    if (allOrderIdsFromItems.length === 0) {
      console.log('⚠️ [fetchDirectVendorOrdersWithDebug] No order IDs found from any items table');
      debugInfo.filteringProcess = filteringProcess;
      return {orders: [], debug: debugInfo};
    }
    
    // Query orders table directly with the collected order IDs
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
      .in('id', allOrderIdsFromItems);
      
    debugInfo.queriedTables.push('orders');
    debugInfo.queries.push({
      table: 'orders',
      operation: 'select',
      filter: `id IN [${allOrderIdsFromItems.slice(0, 3)}...]`,
      timestamp: new Date().toISOString()
    });
      
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
      
      debugInfo.appliedFilters = filters;
    }
    
    // Sort by creation date, newest first
    query = query.order('created_at', { ascending: false });
    
    const { data: ordersData, error: ordersError } = await query;
    
    if (ordersError) {
      console.error('🚫 [fetchDirectVendorOrdersWithDebug] Error fetching orders:', ordersError.message);
      debugInfo.ordersError = ordersError.message;
      debugInfo.queries[debugInfo.queries.length - 1].error = ordersError.message;
      return {orders: [], debug: debugInfo};
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('⚠️ [fetchDirectVendorOrdersWithDebug] No orders found matching the criteria');
      debugInfo.ordersCount = 0;
      filteringProcess.steps.push({
        source: 'orders',
        count: 0,
        message: 'No orders found in database matching order IDs from items'
      });
      
      // Check if the orders table exists and has data at all
      const { count: totalOrdersCount, error: ordersCountError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
        
      if (!ordersCountError) {
        debugInfo.totalOrdersInSystem = totalOrdersCount || 0;
        console.log(`ℹ️ [fetchDirectVendorOrdersWithDebug] Total orders in system: ${totalOrdersCount || 0}`);
      }
      
      debugInfo.filteringProcess = filteringProcess;
      return {orders: [], debug: debugInfo};
    }
    
    console.log(`✅ [fetchDirectVendorOrdersWithDebug] Found ${ordersData.length} orders for vendor ${vendorId}`);
    debugInfo.ordersCount = ordersData.length;
    debugInfo.ordersSample = ordersData.slice(0, 2);
    
    filteringProcess.steps.push({
      source: 'orders',
      count: ordersData.length,
      message: `Found ${ordersData.length} orders matching the order IDs`
    });
    
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
          console.log(`⚠️ [fetchDirectVendorOrdersWithDebug] Order ${order.id} has no items from this vendor after filtering`);
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
        console.error('🚫 [fetchDirectVendorOrdersWithDebug] Error processing order:', order.id, err);
        debugInfo.processingErrors = debugInfo.processingErrors || [];
        debugInfo.processingErrors.push({
          orderId: order.id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    filteringProcess.steps.push({
      source: 'final_processing',
      vendorOrdersFound: vendorOrders.length,
      message: `${vendorOrders.length} orders with items from this vendor after filtering`
    });
    
    console.log(`📦 [fetchDirectVendorOrdersWithDebug] Successfully processed ${vendorOrders.length} vendor orders`);
    debugInfo.processedOrdersCount = vendorOrders.length;
    debugInfo.filteringProcess = filteringProcess;
    
    // Add a sample of the processed orders to debug info
    if (vendorOrders.length > 0) {
      debugInfo.processedOrdersSample = vendorOrders.slice(0, 1).map(order => ({
        id: order.id,
        status: order.status,
        items_count: order.itens?.length || 0,
        customer: order.cliente ? { id: order.cliente.id, name: order.cliente.nome } : null
      }));
    }
    
    return {
      orders: vendorOrders,
      debug: debug ? debugInfo : undefined
    };
    
  } catch (error) {
    console.error('🚫 [fetchDirectVendorOrdersWithDebug] Unexpected error:', error);
    return {
      orders: [],
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        vendorId,
        timestamp: new Date().toISOString()
      }
    };
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
    // Get the enhanced version with debug info
    const result = await fetchDirectVendorOrdersWithDebug(vendorId, filters, false);
    return result.orders;
  } catch (error) {
    console.error('🚫 [fetchDirectVendorOrders] Error:', error);
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
