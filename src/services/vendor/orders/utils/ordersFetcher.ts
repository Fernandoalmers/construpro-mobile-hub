
import { supabase } from "@/integrations/supabase/client";
import { VendorOrder, OrderFilters } from "../types";
import { 
  getVendorId, 
  getVendorProductIds, 
  getVendorOrderIds, 
  fetchOrdersByIds 
} from "./orderQueries";
import { buildVendorOrder, applySearchFilter } from "./orderProcessing";
import { createDiagnosticMetrics, measureExecutionTime } from "./diagnosticMetrics";

/**
 * Fetches orders for the current vendor from the orders table
 */
export const fetchVendorOrders = async (
  filters: OrderFilters = {}
): Promise<VendorOrder[]> => {
  try {
    console.log('🔍 [fetchVendorOrders] Fetching vendor orders with filters:', filters);
    
    // Get the vendor ID for the current user
    const vendorId = await getVendorId();
    if (!vendorId) return [];
    
    console.log('👤 [fetchVendorOrders] Found vendor ID:', vendorId);
    
    // Get all product IDs for this vendor
    const vendorProductIds = await getVendorProductIds(vendorId);
    if (vendorProductIds.length === 0) {
      console.log('⚠️ [fetchVendorOrders] No products found for this vendor');
      return [];
    }
    
    // Get order IDs that contain products from this vendor
    const orderIds = await getVendorOrderIds(vendorProductIds);
    if (orderIds.length === 0) {
      console.log('⚠️ [fetchVendorOrders] No orders found for this vendor');
      return [];
    }
    
    console.log('📦 [fetchVendorOrders] Found', orderIds.length, 'orders for vendor');
    
    // Fetch orders with filters
    const ordersData = await fetchOrdersByIds(orderIds, filters);
    if (ordersData.length === 0) {
      console.log('⚠️ [fetchVendorOrders] No orders found after filtering');
      return [];
    }
    
    console.log('✅ [fetchVendorOrders] Found', ordersData.length, 'orders after filtering');
    
    // Process orders and get customer info
    const orders: VendorOrder[] = [];
    
    for (const order of ordersData) {
      try {
        const fullOrder = await buildVendorOrder(order, vendorId, vendorProductIds);
        orders.push(fullOrder);
      } catch (error) {
        console.error(`❌ [fetchVendorOrders] Error processing order ${order.id}:`, error);
      }
    }
    
    // Apply search filter
    const filteredOrders = applySearchFilter(orders, filters.search || filters.searchTerm);
    
    console.log('✅ [fetchVendorOrders] Returning', filteredOrders.length, 'processed orders');
    return filteredOrders;
    
  } catch (error) {
    console.error('❌ [fetchVendorOrders] Unexpected error:', error);
    return [];
  }
};

/**
 * Fetches complete order details including items
 */
export const getOrderDetails = async (orderId: string): Promise<VendorOrder | null> => {
  try {
    // Get the vendor ID for the current user
    const vendorId = await getVendorId();
    if (!vendorId) return null;
    
    // Get order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        forma_pagamento,
        valor_total,
        endereco_entrega,
        created_at,
        cliente_id,
        pontos_ganhos,
        rastreio
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError || !orderData) {
      console.error('❌ [getOrderDetails] Error fetching order details:', orderError);
      return null;
    }
    
    // Get vendor product IDs
    const vendorProductIds = await getVendorProductIds(vendorId);
    
    // Verify this vendor has items in this order
    const { data: vendorCheck, error: vendorCheckError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderId)
      .in('produto_id', vendorProductIds)
      .limit(1);
    
    if (vendorCheckError || !vendorCheck || vendorCheck.length === 0) {
      console.error('❌ [getOrderDetails] Vendor does not have access to this order');
      return null;
    }
    
    // Build full order object
    const fullOrder = await buildVendorOrder(orderData, vendorId, vendorProductIds);
    return fullOrder;
    
  } catch (error) {
    console.error('❌ [getOrderDetails] Unexpected error:', error);
    return null;
  }
};

/**
 * Direct fetcher that exposes debug info
 * USE FOR DIAGNOSTICS ONLY
 */
export const fetchDirectVendorOrdersWithDebug = async (
  vendorId?: string,
  filters?: OrderFilters,
  includeDebug?: boolean
): Promise<any> => {
  try {
    const startTime = performance.now();
    const metrics = createDiagnosticMetrics();
    
    // Get the vendor ID if not provided
    let resolvedVendorId = vendorId;
    if (!resolvedVendorId) {
      resolvedVendorId = await measureExecutionTime('get_vendor_id', () => getVendorId(), metrics);
      if (!resolvedVendorId) {
        return { 
          error: 'Vendor ID not found',
          metrics: metrics.get()
        };
      }
    }
    
    // Get vendor product IDs
    const vendorProductIds = await measureExecutionTime(
      'fetch_vendor_products', 
      () => getVendorProductIds(resolvedVendorId!), 
      metrics
    );
    
    // Get vendor order IDs from order_items
    const orderIds = await measureExecutionTime(
      'fetch_vendor_order_ids', 
      () => getVendorOrderIds(vendorProductIds), 
      metrics
    );
    
    // Fetch orders
    const ordersData = await measureExecutionTime(
      'fetch_orders', 
      () => fetchOrdersByIds(orderIds.slice(0, 10)), // Limit to 10 for debug
      metrics
    );
    
    // Check for vendor customers table data
    const vendorCustomersStart = performance.now();
    const { data: vendorCustomers, error: vendorCustomersError } = await supabase
      .from('clientes_vendedor')
      .select('count')
      .eq('vendedor_id', resolvedVendorId);
      
    metrics.add('check_vendor_customers', performance.now() - vendorCustomersStart);
    
    // Get total execution time
    metrics.add('total_execution', performance.now() - startTime);
    
    return {
      success: true,
      orders: ordersData,
      ordersCount: ordersData?.length || 0,
      vendorOrderIds: orderIds.length,
      vendorCustomers: {
        count: vendorCustomers && vendorCustomers[0] ? vendorCustomers[0].count : 0,
        error: vendorCustomersError
      },
      metrics: metrics.get(),
      debug: includeDebug ? {
        vendorId: resolvedVendorId,
        timestamp: new Date().toISOString(),
        vendorProductsCount: vendorProductIds.length,
        orderItemsCount: orderIds.length
      } : undefined
    };
    
  } catch (error) {
    console.error('❌ [fetchDirectVendorOrdersWithDebug] Unexpected error:', error);
    return { 
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export this function for use in other files
export const fetchDirectVendorOrders = async (
  vendorId: string,
  filters?: OrderFilters
): Promise<VendorOrder[]> => {
  const result = await fetchDirectVendorOrdersWithDebug(vendorId, filters);
  
  if (result.success && result.orders) {
    // Process the orders to match VendorOrder type
    const orders: VendorOrder[] = [];
    const vendorProductIds = await getVendorProductIds(vendorId);
    
    for (const order of result.orders) {
      try {
        const fullOrder = await buildVendorOrder(order, vendorId, vendorProductIds);
        orders.push(fullOrder);
      } catch (error) {
        console.error(`❌ [fetchDirectVendorOrders] Error processing order ${order.id}:`, error);
      }
    }
    
    return orders;
  }
  
  return [];
};
