
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from '../../vendorProfileService';
import { VendorCustomer } from '../../vendorCustomersService';
import { VendorOrder, OrderItem } from './types';

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
  } catch (mainError) {
    console.error('Unexpected error in fetchOrdersFromPedidos:', mainError);
    return [];
  }
};

// Helper to get vendor product IDs with improved error handling
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  try {
    console.log('Getting product IDs for vendor:', vendorId);
    
    // Get all produtos owned by this vendor
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
      
      // Try alternate product table as backup
      const { data: altProducts, error: altError } = await supabase
        .from('products') // Alternative product table that might be used
        .select('id')
        .eq('vendedor_id', vendorId);
        
      if (altError || !altProducts || altProducts.length === 0) {
        console.log('No products found in alternate table either');
        return [];
      }
      
      console.log(`Found ${altProducts.length} products in alternate table`);
      return altProducts.map(p => p.id);
    }
    
    console.log(`Found ${vendorProducts.length} products for this vendor`);
    return vendorProducts.map(p => p.id);
  } catch (error) {
    console.error('Unexpected error in getVendorProductIds:', error);
    return [];
  }
};

// FIX: Resolving the deep type instantiation issue by using explicit typing and avoiding recursive references
// Helper to get orders based on product items (new structure) with improved implementation
export const fetchOrdersFromOrderItems = async (vendorId: string, productIds: string[]): Promise<VendorOrder[]> => {
  if (productIds.length === 0) {
    console.log('No product IDs provided for vendor', vendorId);
    return [];
  }
  
  try {
    console.log(`Fetching order items for ${productIds.length} vendor products`);
    
    // IMPROVED APPROACH: Direct join query to get all related data in one go
    // FIX: Using a more explicit typing approach to avoid excessive type instantiation
    const { data: orderItemsWithOrdersData, error: joinQueryError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        orders!inner(
          id, 
          cliente_id, 
          valor_total,
          status,
          forma_pagamento,
          endereco_entrega,
          created_at,
          updated_at
        ),
        produtos!inner(id, nome, descricao, preco_normal, imagens)
      `)
      .in('produto_id', productIds)
      .order('created_at', { ascending: false });
      
    if (joinQueryError) {
      console.error('Error in join query for orders:', joinQueryError);
      
      // Try fallback approach with separate queries
      return await fallbackOrdersFetch(vendorId, productIds);
    }
    
    if (!orderItemsWithOrdersData || orderItemsWithOrdersData.length === 0) {
      console.log('No order items found with vendor products using join query');
      return await fallbackOrdersFetch(vendorId, productIds);
    }
    
    console.log(`Found ${orderItemsWithOrdersData.length} order items with join query`);
    
    // Group by order_id to consolidate items per order
    const orderMap: Record<string, {
      order: any,
      items: OrderItem[]
    }> = {};
    
    // Process the joined data
    orderItemsWithOrdersData.forEach(item => {
      const orderId = item.order_id;
      
      // FIX: Safely access nested properties to avoid type errors
      const orderInfo = item.orders;
      
      if (!orderInfo) {
        console.log(`Missing order info for item ${item.id}`);
        return;
      }
      
      // Initialize order if not already in map
      if (!orderMap[orderId]) {
        orderMap[orderId] = {
          order: orderInfo,
          items: []
        };
      }
      
      // Add this item to the order
      // FIX: Create a clean object with only needed properties instead of spreading the whole object
      const processedItem: OrderItem = {
        id: item.id,
        pedido_id: undefined,
        order_id: item.order_id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        total: item.subtotal || (item.quantidade * item.preco_unitario) || 0,
        subtotal: item.subtotal,
        produto: item.produtos,
        produtos: item.produtos
      };
      
      orderMap[orderId].items.push(processedItem);
    });
    
    // Create VendorOrder objects from the grouped data
    const vendorOrders: VendorOrder[] = [];
    
    // Process each order
    for (const orderId in orderMap) {
      const orderData = orderMap[orderId];
      const clienteId = orderData.order.cliente_id;
      
      // Get cliente info
      const { data: clienteData } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone')
        .eq('id', clienteId)
        .maybeSingle();
        
      const clienteInfo: VendorCustomer = {
        id: clienteId || '',
        vendedor_id: vendorId,
        usuario_id: clienteId,
        nome: clienteData?.nome || 'Cliente',
        telefone: clienteData?.telefone || '',
        email: clienteData?.email || '',
        total_gasto: 0
      };
      
      // Calculate vendor's portion of the total
      const vendorTotal = orderData.items.reduce((sum, item) => {
        const itemTotal = Number(item.total || item.subtotal || (item.quantidade * item.preco_unitario) || 0);
        return sum + itemTotal;
      }, 0);
      
      // Create vendor order
      const vendorOrder: VendorOrder = {
        id: orderId,
        cliente_id: clienteId,
        valor_total: vendorTotal,
        status: orderData.order.status || 'pendente',
        forma_pagamento: orderData.order.forma_pagamento || 'Não especificado',
        endereco_entrega: orderData.order.endereco_entrega,
        created_at: orderData.order.created_at || new Date().toISOString(),
        cliente: clienteInfo,
        itens: orderData.items
      };
      
      vendorOrders.push(vendorOrder);
    }
    
    console.log(`Successfully processed ${vendorOrders.length} vendor orders from order_items`);
    return vendorOrders;
    
  } catch (error) {
    console.error('Unexpected error in fetchOrdersFromOrderItems:', error);
    return [];
  }
};

// Fallback approach using multiple simpler queries
const fallbackOrdersFetch = async (vendorId: string, productIds: string[]): Promise<VendorOrder[]> => {
  console.log('Using fallback order fetching approach');
  
  try {
    // Get order_items that contain vendor products
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
    } else {
      console.log('Failed to fetch product details');
    }
    
    // Group order items by order_id
    const orderItemsMap: Record<string, OrderItem[]> = {};
    orderItemsData.forEach(item => {
      if (!orderItemsMap[item.order_id]) {
        orderItemsMap[item.order_id] = [];
      }
      // Add product data to item
      // FIX: Create a clean object with only needed properties instead of spreading the whole object
      const itemWithProduct: OrderItem = {
        id: item.id,
        pedido_id: undefined,
        order_id: item.order_id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        total: item.subtotal || (item.preco_unitario * item.quantidade) || 0,
        subtotal: item.subtotal,
        produto: productMap[item.produto_id],
        produtos: productMap[item.produto_id]
      };
      orderItemsMap[item.order_id].push(itemWithProduct);
    });
    
    // Fetch orders with customer information
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
      console.error('Error fetching orders for vendor products:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log('No orders found for the vendor products');
      return [];
    }
    
    console.log('Successfully fetched', ordersData.length, 'orders from orders table');
    
    // Process orders
    const orders: VendorOrder[] = [];
    for (const order of ordersData) {
      // Get vendor items for this order
      const vendorItems = orderItemsMap[order.id] || [];
      
      if (vendorItems.length > 0) {
        try {
          // Get client profile
          const { data: clienteData } = await supabase
            .from('profiles')
            .select('id, nome, email, telefone')
            .eq('id', order.cliente_id)
            .maybeSingle();
            
          // Calculate vendor's portion of the order
          const vendorTotal = vendorItems.reduce((sum, item) => {
            const itemTotal = Number(item.total || item.subtotal || (item.quantidade * item.preco_unitario) || 0);
            return sum + itemTotal;
          }, 0);
          
          // Create cliente info with correct fields
          const clienteInfo: VendorCustomer = {
            id: order.cliente_id || '',
            vendedor_id: vendorId,
            usuario_id: order.cliente_id,
            nome: clienteData?.nome || 'Cliente',
            telefone: clienteData?.telefone || '',
            email: clienteData?.email || '',
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
        } catch (err) {
          console.error('Error processing order:', order.id, err);
        }
      }
    }
    
    return orders;
  } catch (error) {
    console.error('Unexpected error in fallbackOrdersFetch:', error);
    return [];
  }
};

// Helper to log diagnostic information with expanded checks
export const logDiagnosticInfo = async (vendorId: string): Promise<void> => {
  try {
    console.log('Running diagnostic checks for vendor ID:', vendorId);
    
    // Check if vendor profile exists in vendedores table
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', vendorId)
      .maybeSingle();
      
    if (vendorError) {
      console.error('Error checking vendor profile:', vendorError);
    } else if (!vendorData) {
      console.error('WARNING: Vendor profile not found in vendedores table with ID:', vendorId);
    } else {
      console.log('Vendor profile found:', vendorData.nome_loja);
    }
    
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
    
    // Check for any orders in pedidos table
    const { count: pedidosCount, error: pedidosCountError } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('vendedor_id', vendorId);
      
    if (pedidosCountError) {
      console.error('Error counting vendor pedidos:', pedidosCountError);
    } else {
      console.log(`Vendor has ${pedidosCount} orders in pedidos table`);
    }
    
    // Check current user info
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
          console.error('CRITICAL: User profile is not set as lojista/vendor. This prevents access to vendor data!');
        }
      }
      
      // Check if vendor profile links to current user
      const { data: vendorProfile, error: vpError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .eq('usuario_id', userData.user.id)
        .maybeSingle();
        
      if (vpError) {
        console.error('Error checking vendor profile for current user:', vpError);
      } else if (!vendorProfile) {
        console.error('CRITICAL: No vendor profile found for current user!');
      } else {
        console.log('User has vendor profile:', vendorProfile.nome_loja);
        
        // If the provided vendorId doesn't match user's vendor profile
        if (vendorProfile.id !== vendorId) {
          console.error(`WARNING: Provided vendor ID (${vendorId}) does not match user's vendor profile ID (${vendorProfile.id})`);
        }
      }
    }
  } catch (err) {
    console.error('Error during diagnostic logging:', err);
  }
};

