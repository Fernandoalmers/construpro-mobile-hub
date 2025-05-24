
import { supabase } from "@/integrations/supabase/client";
import { VendorOrder, OrderFilters, OrderItem } from "../types";
import { fetchCustomerInfo } from "./clientInfoFetcher";
import { VendorCustomer } from '../../../vendorCustomersService';
import { fetchProductDetails } from "../../../vendor/products/productFetcher";

// Simple metrics utility since the imported one is missing
const createDiagnosticMetrics = () => {
  const metrics: Record<string, number> = {};
  
  return {
    add: (name: string, value: number) => {
      metrics[name] = value;
    },
    get: () => metrics
  };
};

/**
 * Fetches orders for the current vendor from the orders table
 */
export const fetchVendorOrders = async (
  filters: OrderFilters = {}
): Promise<VendorOrder[]> => {
  try {
    console.log('🔍 [fetchVendorOrders] Fetching vendor orders with filters:', filters);
    
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('❌ [fetchVendorOrders] Error fetching vendor ID:', vendorError);
      return [];
    }
    
    const vendorId = vendorData;
    console.log('👤 [fetchVendorOrders] Found vendor ID:', vendorId);
    
    // Get all order IDs that contain products from this vendor
    const { data: vendorOrderIds, error: orderIdsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        produtos!inner(vendedor_id)
      `)
      .eq('produtos.vendedor_id', vendorId);
    
    if (orderIdsError) {
      console.error('❌ [fetchVendorOrders] Error fetching vendor order IDs:', orderIdsError);
      return [];
    }
    
    if (!vendorOrderIds || vendorOrderIds.length === 0) {
      console.log('⚠️ [fetchVendorOrders] No orders found for this vendor');
      return [];
    }
    
    // Extract unique order IDs
    const orderIds = [...new Set(vendorOrderIds.map(item => item.order_id))];
    console.log('📦 [fetchVendorOrders] Found', orderIds.length, 'orders for vendor');
    
    // Build query for orders
    let query = supabase
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
      .in('id', orderIds)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }
    
    const { data: ordersData, error: ordersError } = await query;
    
    if (ordersError) {
      console.error('❌ [fetchVendorOrders] Error fetching orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('⚠️ [fetchVendorOrders] No orders found after filtering');
      return [];
    }
    
    console.log('✅ [fetchVendorOrders] Found', ordersData.length, 'orders after filtering');
    
    // Process orders and get customer info
    const orders: VendorOrder[] = [];
    
    for (const order of ordersData) {
      try {
        // Get customer info using cliente_id
        const customerInfo = await fetchCustomerInfo(order.cliente_id, vendorId);
        
        // Get order items for this vendor only
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            produtos!inner(vendedor_id, nome, imagens, descricao, preco_normal, categoria)
          `)
          .eq('order_id', order.id)
          .eq('produtos.vendedor_id', vendorId);
        
        if (itemsError) {
          console.error('❌ [fetchVendorOrders] Error fetching items for order', order.id, ':', itemsError);
          continue;
        }
        
        // Process items
        const items: OrderItem[] = itemsData?.map(item => ({
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          produto: item.produtos ? {
            id: item.produto_id,
            nome: item.produtos.nome || 'Produto',
            imagens: item.produtos.imagens || [],
            descricao: item.produtos.descricao || '',
            preco_normal: item.produtos.preco_normal || item.preco_unitario,
            categoria: item.produtos.categoria || ''
          } : undefined
        })) || [];
        
        // Calculate vendor-specific total
        const vendorTotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        
        // Build full order object
        const fullOrder: VendorOrder = {
          id: order.id,
          status: order.status,
          forma_pagamento: order.forma_pagamento,
          valor_total: vendorTotal, // Use vendor-specific total
          endereco_entrega: order.endereco_entrega,
          created_at: order.created_at,
          data_criacao: order.created_at,
          cliente: {
            id: order.cliente_id,
            nome: customerInfo?.nome || 'Cliente',
            email: customerInfo?.email || '',
            telefone: customerInfo?.telefone || '',
            usuario_id: order.cliente_id,
            vendedor_id: vendorId,
            total_gasto: customerInfo?.total_gasto || 0
          },
          itens: items
        };
        
        orders.push(fullOrder);
      } catch (error) {
        console.error(`❌ [fetchVendorOrders] Error processing order ${order.id}:`, error);
      }
    }
    
    // Apply search filter in memory if needed
    const searchTerm = filters.search || filters.searchTerm;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      const filteredOrders = orders.filter(order => 
        order.cliente?.nome?.toLowerCase().includes(searchTermLower) ||
        order.cliente?.email?.toLowerCase().includes(searchTermLower) ||
        order.id.toLowerCase().includes(searchTermLower)
      );
      
      console.log('🔍 [fetchVendorOrders] Applied search filter, found', filteredOrders.length, 'matching orders');
      return filteredOrders;
    }
    
    console.log('✅ [fetchVendorOrders] Returning', orders.length, 'processed orders');
    return orders;
    
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
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('❌ [getOrderDetails] Error fetching vendor ID:', vendorError);
      return null;
    }
    
    const vendorId = vendorData;
    
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
    
    // Verify this vendor has items in this order
    const { data: vendorCheck, error: vendorCheckError } = await supabase
      .from('order_items')
      .select('id, produtos!inner(vendedor_id)')
      .eq('order_id', orderId)
      .eq('produtos.vendedor_id', vendorId)
      .limit(1);
    
    if (vendorCheckError || !vendorCheck || vendorCheck.length === 0) {
      console.error('❌ [getOrderDetails] Vendor does not have access to this order');
      return null;
    }
    
    // Get customer info
    const customerInfo = await fetchCustomerInfo(orderData.cliente_id, vendorId);
    
    // Get order items for this vendor only
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        produtos!inner(vendedor_id, nome, imagens, descricao, preco_normal, categoria)
      `)
      .eq('order_id', orderId)
      .eq('produtos.vendedor_id', vendorId);
    
    if (itemsError) {
      console.error('❌ [getOrderDetails] Error fetching order items:', itemsError);
      return null;
    }
    
    // Process items
    const items: OrderItem[] = itemsData?.map(item => ({
      id: item.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
      produto: item.produtos ? {
        id: item.produto_id,
        nome: item.produtos.nome || 'Produto',
        imagens: item.produtos.imagens || [],
        descricao: item.produtos.descricao || '',
        preco_normal: item.produtos.preco_normal || item.preco_unitario,
        categoria: item.produtos.categoria || ''
      } : undefined
    })) || [];
    
    // Calculate vendor-specific total
    const vendorTotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    // Build full order object
    const fullOrder: VendorOrder = {
      id: orderData.id,
      status: orderData.status,
      forma_pagamento: orderData.forma_pagamento,
      valor_total: vendorTotal,
      endereco_entrega: orderData.endereco_entrega,
      created_at: orderData.created_at,
      data_criacao: orderData.created_at,
      cliente: {
        id: orderData.cliente_id,
        nome: customerInfo?.nome || 'Cliente',
        email: customerInfo?.email || '',
        telefone: customerInfo?.telefone || '',
        usuario_id: orderData.cliente_id,
        vendedor_id: vendorId,
        total_gasto: customerInfo?.total_gasto || 0
      },
      itens: items
    };
    
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
      const vendorIdResult = await supabase.rpc('get_vendor_id');
      metrics.add('get_vendor_id', performance.now() - startTime);
      
      if (vendorIdResult.error) {
        return { 
          error: vendorIdResult.error,
          metrics: metrics.get()
        };
      }
      
      resolvedVendorId = vendorIdResult.data;
    }
    
    // Get vendor order IDs from order_items + produtos
    const vendorOrdersStart = performance.now();
    const { data: vendorOrderIds, error: orderIdsError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        produtos!inner(vendedor_id)
      `)
      .eq('produtos.vendedor_id', resolvedVendorId);
      
    metrics.add('fetch_vendor_order_ids', performance.now() - vendorOrdersStart);
    
    if (orderIdsError) {
      return { 
        error: orderIdsError,
        metrics: metrics.get()
      };
    }
    
    const orderIds = [...new Set(vendorOrderIds?.map(item => item.order_id) || [])];
    
    // Fetch orders
    const ordersStart = performance.now();
    const ordersResult = await supabase
      .from('orders')
      .select(`
        id,
        status,
        forma_pagamento,
        valor_total,
        endereco_entrega,
        created_at,
        cliente_id
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: false })
      .limit(10);
      
    metrics.add('fetch_orders', performance.now() - ordersStart);
    
    if (ordersResult.error) {
      return { 
        error: ordersResult.error,
        metrics: metrics.get()
      };
    }
    
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
      orders: ordersResult.data,
      ordersCount: ordersResult.data?.length || 0,
      vendorOrderIds: orderIds.length,
      vendorCustomers: {
        count: vendorCustomers && vendorCustomers[0] ? vendorCustomers[0].count : 0,
        error: vendorCustomersError
      },
      metrics: metrics.get(),
      debug: includeDebug ? {
        vendorId: resolvedVendorId,
        timestamp: new Date().toISOString(),
        vendorProductsCount: 0, // Would need additional query
        orderItemsCount: vendorOrderIds?.length || 0
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
    
    for (const order of result.orders) {
      try {
        // Get customer info
        const customerInfo = await fetchCustomerInfo(order.cliente_id, vendorId);
        
        // Get order items for this vendor
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            produtos!inner(vendedor_id, nome, imagens)
          `)
          .eq('order_id', order.id)
          .eq('produtos.vendedor_id', vendorId);
        
        const items: OrderItem[] = itemsData?.map(item => ({
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          produto: item.produtos ? {
            id: item.produto_id,
            nome: item.produtos.nome || 'Produto',
            imagens: item.produtos.imagens || [],
            descricao: '',
            preco_normal: item.preco_unitario,
            categoria: ''
          } : undefined
        })) || [];
        
        // Calculate vendor total
        const vendorTotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        
        // Build full order object
        const fullOrder: VendorOrder = {
          id: order.id,
          status: order.status,
          forma_pagamento: order.forma_pagamento,
          valor_total: vendorTotal,
          endereco_entrega: order.endereco_entrega,
          created_at: order.created_at,
          data_criacao: order.created_at,
          cliente: {
            id: order.cliente_id,
            nome: customerInfo?.nome || 'Cliente',
            email: customerInfo?.email || '',
            telefone: customerInfo?.telefone || '',
            usuario_id: order.cliente_id,
            vendedor_id: vendorId,
            total_gasto: customerInfo?.total_gasto || 0
          },
          itens: items
        };
        
        orders.push(fullOrder);
      } catch (error) {
        console.error(`❌ [fetchDirectVendorOrders] Error processing order ${order.id}:`, error);
      }
    }
    
    return orders;
  }
  
  return [];
};
