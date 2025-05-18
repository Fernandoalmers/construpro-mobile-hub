
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
  // Improved error handling and logging
  try {
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
  } catch (error) {
    console.error('Unexpected error in getVendorProductIds:', error);
    return [];
  }
};

// Helper to get orders based on product items (new structure) - IMPROVED VERSION
export const fetchOrdersFromOrderItems = async (vendorId: string, productIds: string[]): Promise<VendorOrder[]> => {
  if (productIds.length === 0) {
    console.log('No product IDs provided for vendor', vendorId);
    return [];
  }
  
  try {
    console.log(`Fetching order items for ${productIds.length} vendor products`);
    
    // Get order_items that contain vendor products - IMPROVED QUERY
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal
      `)
      .in('produto_id', productIds);
    
    if (orderItemsError) {
      console.error('Error fetching order items for vendor products:', orderItemsError);
      return [];
    }
    
    if (!orderItemsData || orderItemsData.length === 0) {
      console.log('No order items found with vendor products');
      return [];
    }
    
    console.log('Found', orderItemsData.length, 'order items with vendor products');
    
    // Get unique order IDs
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
    console.log('Found', orderIds.length, 'unique orders with vendor products');
    
    if (orderIds.length === 0) {
      return [];
    }
    
    // Get product details for order items - ENHANCED PRODUCT FETCHING
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
    
    // Group order items by order_id - IMPROVED GROUPING
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
        total: item.subtotal || (item.preco_unitario * item.quantidade) || 0
      };
      orderItemsMap[item.order_id].push(itemWithProduct);
    });
    
    // Fetch orders with customer information - IMPROVED ORDER FETCHING
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
        cliente:profiles!cliente_id(id, nome, email, telefone)
      `)
      .in('id', orderIds)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders for vendor products:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found for the vendor products');
      return [];
    }
    
    console.log('Successfully fetched', ordersData.length, 'orders from orders table');
    
    // Process orders - IMPROVED ORDER PROCESSING
    const orders: VendorOrder[] = [];
    for (const order of ordersData) {
      // Get vendor items for this order
      const vendorItems = orderItemsMap[order.id] || [];
      
      if (vendorItems.length > 0) {
        // Calculate vendor's portion of the order - FIXED CALCULATION
        const vendorTotal = vendorItems.reduce((sum, item) => {
          const itemTotal = Number(item.total || item.subtotal || (item.quantidade * item.preco_unitario) || 0);
          return sum + itemTotal;
        }, 0);
        
        // Create cliente info with correct fields
        const clienteInfo: VendorCustomer = {
          id: order.cliente_id || '',
          vendedor_id: vendorId,
          usuario_id: order.cliente_id,
          nome: order.cliente?.nome || 'Cliente',
          telefone: order.cliente?.telefone || '',
          email: order.cliente?.email || '',
          total_gasto: 0
        };
        
        // Create a vendor-specific view of the order with all required fields
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
        
        orders.push(vendorOrder);
      }
    }
    
    return orders;
  } catch (error) {
    console.error('Unexpected error in fetchOrdersFromOrderItems:', error);
    return [];
  }
};

// Helper to log diagnostic information
export const logDiagnosticInfo = async (vendorId: string): Promise<void> => {
  try {
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
    
    // Check user profile information
    const { data: userData } = await supabase.auth.getUser();
    if (userData && userData.user) {
      console.log('Current user ID:', userData.user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('papel, tipo_perfil')
        .eq('id', userData.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profileData) {
        console.log('User profile type:', profileData.tipo_perfil);
        console.log('User profile role:', profileData.papel);
        
        // If user is not a vendor, log this as an issue
        if (profileData.tipo_perfil !== 'lojista' && profileData.papel !== 'lojista') {
          console.log('WARNING: User profile is not set as lojista/vendor. This may cause permission issues.');
        }
      }
    }
  } catch (err) {
    console.error('Error during diagnostic logging:', err);
  }
};
