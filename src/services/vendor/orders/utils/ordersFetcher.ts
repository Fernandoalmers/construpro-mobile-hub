
import { supabase } from "@/integrations/supabase/client";
import { VendorOrder, OrderFilters } from "..";
import { fetchCustomerInfo } from "./clientInfoFetcher";
import { fetchProductDetails } from "./productFetcher";
import { diagnosticMetrics } from "./diagnosticUtils";

/**
 * Fetches orders for the current vendor with proper error handling
 */
export const fetchVendorOrders = async (
  filters: OrderFilters = {}
): Promise<VendorOrder[]> => {
  try {
    console.log('Fetching vendor orders with filters:', filters);
    
    // Get the vendor ID for the current user
    const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
    
    if (vendorError || !vendorData) {
      console.error('Error fetching vendor ID:', vendorError);
      return [];
    }
    
    const vendorId = vendorData;
    
    let query = supabase
      .from('pedidos')
      .select(`
        id,
        status,
        forma_pagamento,
        valor_total,
        endereco_entrega,
        created_at,
        usuario_id
      `)
      .eq('vendedor_id', vendorId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      // Add one day to include the end date fully
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }
    
    if (filters.search) {
      // Since pedidos doesn't have customer name, we can't filter by it directly
      // We'll need to fetch all and filter in memory, or implement a more complex query
    }
    
    const { data: ordersData, error: ordersError } = await query;
    
    if (ordersError) {
      console.error('Error fetching vendor orders:', ordersError);
      return [];
    }
    
    // Process the orders with customer info
    const orders: VendorOrder[] = [];
    
    for (const order of ordersData) {
      try {
        // Get customer info - this now uses the clientes_vendedor table when available
        const customerInfo = await fetchCustomerInfo(order.usuario_id, vendorId);
        
        // Build full order object
        const fullOrder: VendorOrder = {
          id: order.id,
          status: order.status,
          forma_pagamento: order.forma_pagamento,
          valor_total: order.valor_total,
          endereco_entrega: order.endereco_entrega,
          data_criacao: order.created_at,
          cliente: {
            id: order.usuario_id,
            nome: customerInfo?.nome || 'Cliente',
            email: customerInfo?.email || '',
            telefone: customerInfo?.telefone || ''
          },
          items: [] // Items will be filled by getOrderDetails if/when needed
        };
        
        orders.push(fullOrder);
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }
    
    // Apply search filter in memory if needed
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase();
      return orders.filter(order => 
        order.cliente.nome.toLowerCase().includes(searchTerm) ||
        order.cliente.email?.toLowerCase().includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm)
      );
    }
    
    return orders;
    
  } catch (error) {
    console.error('Error in fetchVendorOrders:', error);
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
      console.error('Error fetching vendor ID:', vendorError);
      return null;
    }
    
    const vendorId = vendorData;
    
    // Get order data
    const { data: orderData, error: orderError } = await supabase
      .from('pedidos')
      .select(`
        id,
        status,
        forma_pagamento,
        valor_total,
        endereco_entrega,
        created_at,
        usuario_id
      `)
      .eq('id', orderId)
      .eq('vendedor_id', vendorId)
      .single();
    
    if (orderError || !orderData) {
      console.error('Error fetching order details:', orderError);
      return null;
    }
    
    // Get customer info - this now uses the clientes_vendedor table when available
    const customerInfo = await fetchCustomerInfo(orderData.usuario_id, vendorId);
    
    // Get order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('itens_pedido')
      .select(`
        id,
        produto_id,
        quantidade,
        preco_unitario,
        total
      `)
      .eq('pedido_id', orderId);
    
    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return null;
    }
    
    // Process items with product details
    const items = [];
    
    for (const item of itemsData || []) {
      const productDetails = await fetchProductDetails(item.produto_id);
      
      items.push({
        id: item.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.total,
        produto: productDetails
      });
    }
    
    // Build full order object
    const fullOrder: VendorOrder = {
      id: orderData.id,
      status: orderData.status,
      forma_pagamento: orderData.forma_pagamento,
      valor_total: orderData.valor_total,
      endereco_entrega: orderData.endereco_entrega,
      data_criacao: orderData.created_at,
      cliente: {
        id: orderData.usuario_id,
        nome: customerInfo?.nome || 'Cliente',
        email: customerInfo?.email || '',
        telefone: customerInfo?.telefone || ''
      },
      items
    };
    
    return fullOrder;
    
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    return null;
  }
};

/**
 * Direct fetcher that exposes debug info
 * USE FOR DIAGNOSTICS ONLY
 */
export const fetchDirectVendorOrdersWithDebug = async (): Promise<any> => {
  try {
    const startTime = performance.now();
    const metrics = diagnosticMetrics();
    
    // Get the vendor ID
    const vendorIdResult = await supabase.rpc('get_vendor_id');
    metrics.add('get_vendor_id', performance.now() - startTime);
    
    if (vendorIdResult.error) {
      return { 
        error: vendorIdResult.error,
        metrics: metrics.get()
      };
    }
    
    const vendorId = vendorIdResult.data;
    
    // Fetch orders
    const ordersStart = performance.now();
    const ordersResult = await supabase
      .from('pedidos')
      .select(`
        id,
        status,
        forma_pagamento,
        valor_total,
        endereco_entrega,
        created_at,
        usuario_id
      `)
      .eq('vendedor_id', vendorId)
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
      .select('count(*)')
      .eq('vendedor_id', vendorId);
      
    metrics.add('check_vendor_customers', performance.now() - vendorCustomersStart);
    
    // Get total execution time
    metrics.add('total_execution', performance.now() - startTime);
    
    return {
      success: true,
      orders: ordersResult.data,
      ordersCount: ordersResult.data?.length || 0,
      vendorCustomers: {
        count: vendorCustomers?.[0]?.count || 0,
        error: vendorCustomersError
      },
      metrics: metrics.get()
    };
    
  } catch (error) {
    console.error('Error in fetchDirectVendorOrdersWithDebug:', error);
    return { 
      error,
      message: error?.message || 'Unknown error'
    };
  }
};
