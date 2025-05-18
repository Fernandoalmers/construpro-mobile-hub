
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder } from './types';
import { fetchCustomerInfo } from './utils/clientInfoFetcher';
import { fetchProductsForItems } from './utils/productFetcher';
import { getVendorProductIds } from './utils/productFetcher';
import { logDiagnosticInfo } from './utils/diagnosticUtils';

// Main function to get all vendor orders
export const getVendorOrders = async (): Promise<VendorOrder[]> => {
  try {
    // Get vendor profile
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('No authenticated user found');
      return [];
    }
    
    // Get vendor id
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id, status')
      .eq('usuario_id', userData.user.id)
      .single();
      
    if (vendorError || !vendorData) {
      console.error('Vendor profile not found:', vendorError);
      return [];
    }
    
    const vendorId = vendorData.id;
    
    console.log('Fetching orders for vendor:', vendorId);
    console.log('Vendor profile details:', {
      nome_loja: vendorData.nome_loja,
      usuario_id: vendorData.usuario_id,
      status: vendorData.status || 'unknown'
    });
    
    // Get all products for this vendor
    const productIds = await getVendorProductIds(vendorId);
    if (!productIds.length) {
      console.log('No products found for vendor, cannot fetch orders');
      await logDiagnosticInfo(vendorId);
      return [];
    }
    
    console.log(`Found ${productIds.length} products, fetching related orders`);
    
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
      return [];
    }
    
    // Extract unique order IDs
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
    console.log(`Found ${orderIds.length} unique orders containing vendor products`);
    
    // Fetch full orders data
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
      console.error('Error fetching orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found matching the order items');
      return [];
    }
    
    console.log(`Successfully fetched ${ordersData.length} orders`);
    
    // Fetch product details for all products in order items
    const productIdsInItems = [...new Set(orderItemsData.map(item => item.produto_id))];
    const productMap = await fetchProductsForItems(productIdsInItems);
    
    // Group order items by order ID and enrich with product data
    const orderItemsMap: Record<string, OrderItem[]> = {};
    
    for (const item of orderItemsData) {
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
    
    // Process orders and map to VendorOrder type
    const vendorOrders: VendorOrder[] = [];
    
    for (const order of ordersData) {
      // Get items for this order
      const orderItems = orderItemsMap[order.id] || [];
      
      if (orderItems.length > 0) {
        try {
          // Get customer info
          const clienteInfo = await fetchCustomerInfo(order.cliente_id, vendorId);
          
          // Calculate vendor's portion of the order total
          const vendorTotal = orderItems.reduce((sum, item) => {
            return sum + (item.total || item.subtotal || (item.quantidade * item.preco_unitario) || 0);
          }, 0);
          
          // Create vendor order
          vendorOrders.push({
            id: order.id,
            cliente_id: order.cliente_id,
            valor_total: vendorTotal,
            status: order.status || 'pendente',
            forma_pagamento: order.forma_pagamento || 'Não especificado',
            endereco_entrega: order.endereco_entrega,
            created_at: order.created_at || new Date().toISOString(),
            cliente: clienteInfo,
            itens: orderItems
          });
        } catch (err) {
          console.error('Error processing order:', order.id, err);
        }
      }
    }
    
    console.log(`Processed ${vendorOrders.length} vendor orders`);
    
    // Sort orders by date, newest first
    vendorOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // If no orders were found, log diagnostic information
    if (vendorOrders.length === 0) {
      console.log('Warning: No orders found for vendor. Running diagnostics...');
      await logDiagnosticInfo(vendorId);
      
      // Check vendor status
      if (vendorData.status === 'pendente') {
        console.log('Warning: Vendor status is "pendente" which may prevent orders from being retrieved');
        console.log('Consider updating vendor status to "ativo"');
      }
    }
    
    return vendorOrders;
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};

// Re-export getVendorProductIds for backward compatibility
export { getVendorProductIds } from './utils/productFetcher';
