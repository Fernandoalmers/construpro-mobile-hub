
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from '../../vendorProfileService';
import { VendorCustomer } from '../../vendorCustomersService';
import { VendorOrder, OrderItem } from './types';

// Helper to get orders from the pedidos table (old structure)
export const fetchOrdersFromPedidos = async (vendorId: string): Promise<VendorOrder[]> => {
  console.log('Fetching orders from pedidos table for vendor:', vendorId);
  
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
      const { data: clienteData } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone')
        .eq('id', pedido.usuario_id)
        .maybeSingle();
      
      const clienteInfo: VendorCustomer = {
        id: pedido.usuario_id || '',
        vendedor_id: vendorId,
        usuario_id: pedido.usuario_id,
        nome: clienteData?.nome || 'Cliente',
        telefone: clienteData?.telefone || '',
        email: clienteData?.email || '',
        total_gasto: 0
      };
      
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
        ...item,
        total: item.total || (item.preco_unitario * item.quantidade)
      }));
      
      orders.push({
        ...pedido,
        itens: convertedItems,
        cliente: clienteInfo
      });
    } catch (err) {
      console.error('Error processing pedido:', pedido.id, err);
    }
  }
  
  return orders;
};

// Helper to get vendor product IDs
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  const { data: vendorProducts, error: productsError } = await supabase
    .from('produtos')
    .select('id')
    .eq('vendedor_id', vendorId);
  
  if (productsError) {
    console.error('Error fetching vendor products:', productsError);
    return [];
  }
  
  if (!vendorProducts || vendorProducts.length === 0) {
    console.log('No products found for vendor');
    return [];
  }
  
  console.log(`Found ${vendorProducts.length} products for this vendor`);
  return vendorProducts.map(p => p.id);
};

// Helper to get orders based on product items (new structure)
export const fetchOrdersFromOrderItems = async (vendorId: string, productIds: string[]): Promise<VendorOrder[]> => {
  if (productIds.length === 0) {
    return [];
  }
  
  // Get order_items that contain vendor products
  const { data: orderItemsData, error: orderItemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('produto_id', productIds);
  
  if (orderItemsError) {
    console.error('Error fetching order items for vendor products:', orderItemsError);
    return [];
  }
  
  if (!orderItemsData || orderItemsData.length === 0) {
    return [];
  }
  
  console.log('Found', orderItemsData.length, 'order items with vendor products');
  
  // Get unique order IDs
  const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
  console.log('Found', orderIds.length, 'unique orders with vendor products');
  
  if (orderIds.length === 0) {
    return [];
  }
  
  // Get product details for order items
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .in('id', productIds);
    
  const productMap: Record<string, any> = {};
  if (produtos) {
    produtos.forEach(product => {
      productMap[product.id] = product;
    });
  }
  
  // Group order items by order_id
  const orderItemsMap: Record<string, OrderItem[]> = {};
  orderItemsData.forEach(item => {
    if (!orderItemsMap[item.order_id]) {
      orderItemsMap[item.order_id] = [];
    }
    // Add product data to item
    const itemWithProduct = {
      ...item,
      produto: productMap[item.produto_id],
      produtos: productMap[item.produto_id],
      total: item.subtotal || (item.preco_unitario * item.quantidade)
    };
    orderItemsMap[item.order_id].push(itemWithProduct);
  });
  
  // Fetch these orders
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('*, cliente:cliente_id (id, nome, email, telefone)')
    .in('id', orderIds)
    .order('created_at', { ascending: false });
  
  if (ordersError) {
    console.error('Error fetching orders for vendor products:', ordersError);
    return [];
  }
  
  if (!ordersData || ordersData.length === 0) {
    return [];
  }
  
  console.log('Successfully fetched', ordersData.length, 'orders from orders table');
  
  // Process orders
  const orders: VendorOrder[] = [];
  for (const order of ordersData) {
    // Get vendor items for this order
    const vendorItems = orderItemsMap[order.id] || [];
    
    if (vendorItems.length > 0) {
      // Calculate vendor's portion of the order
      const vendorTotal = vendorItems.reduce((sum, item) => {
        return sum + (item.total || item.subtotal || (item.quantidade * item.preco_unitario) || 0);
      }, 0);
      
      // Create cliente info
      const clienteInfo: VendorCustomer = {
        id: order.cliente_id || '',
        vendedor_id: vendorId,
        usuario_id: order.cliente_id,
        nome: order.cliente?.nome || 'Cliente',
        telefone: order.cliente?.telefone || '',
        email: order.cliente?.email || '',
        total_gasto: 0
      };
      
      // Create a vendor-specific view of the order
      const vendorOrder: VendorOrder = {
        id: order.id,
        cliente_id: order.cliente_id,
        valor_total: vendorTotal,
        status: order.status || 'pendente',
        forma_pagamento: order.forma_pagamento || 'Não especificado',
        endereco_entrega: order.endereco_entrega,
        created_at: order.created_at || order.data_criacao || new Date().toISOString(),
        cliente: clienteInfo,
        itens: vendorItems
      };
      
      orders.push(vendorOrder);
    }
  }
  
  return orders;
};

// Helper to log diagnostic information
export const logDiagnosticInfo = async (vendorId: string): Promise<void> => {
  console.log('Vendor profile ID:', vendorId);
  
  // Check if the vendor has any products
  const { count: productCount, error: countError } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .eq('vendedor_id', vendorId);
    
  if (countError) {
    console.error('Error counting vendor products:', countError);
  } else {
    console.log(`Vendor has ${productCount} products in database`);
  }
};
