
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from './vendorProfileService';
import { VendorCustomer } from './vendorCustomersService';
import { toast } from '@/components/ui/sonner';

export interface OrderItem {
  id: string;
  pedido_id?: string;
  order_id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  subtotal?: number;
  created_at?: string;
  produto?: any;
  produtos?: any;
}

export interface VendorOrder {
  id: string;
  vendedor_id?: string;
  usuario_id?: string;
  cliente_id?: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  created_at: string;
  data_entrega_estimada?: string;
  cliente?: VendorCustomer;
  itens?: OrderItem[];
}

// Vendor Orders Management
export const getVendorOrders = async (): Promise<VendorOrder[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    console.log('Fetching orders for vendor:', vendorProfile.id);
    
    // Combined array for all vendor orders
    const combinedOrders: VendorOrder[] = [];
    
    // 1. First, fetch orders from the pedidos table (old structure)
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
    if (pedidosError) {
      console.error('Error fetching vendor orders from pedidos:', pedidosError);
    } else if (pedidosData && pedidosData.length > 0) {
      console.log('Found', pedidosData.length, 'orders in pedidos table');
      
      // Process pedidos
      for (const pedido of pedidosData) {
        try {
          // For each pedido, get cliente info separately
          const { data: clienteData } = await supabase
            .from('profiles')
            .select('id, nome, email, telefone')
            .eq('id', pedido.usuario_id)
            .maybeSingle();
          
          const clienteInfo: VendorCustomer = {
            id: pedido.usuario_id || '',
            vendedor_id: vendorProfile.id,
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
          
          // Convert items to match OrderItem structure
          const convertedItems: OrderItem[] = (itemsData || []).map(item => ({
            ...item,
            total: item.total || (item.preco_unitario * item.quantidade)
          }));
          
          combinedOrders.push({
            ...pedido,
            itens: convertedItems,
            cliente: clienteInfo
          });
        } catch (err) {
          console.error('Error processing pedido:', pedido.id, err);
        }
      }
    } else {
      console.log('No orders found in pedidos table');
    }
    
    // 2. Fetch vendor's products to determine which orders from orders table belong to this vendor
    const { data: vendorProducts, error: productsError } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorProfile.id);
    
    if (productsError) {
      console.error('Error fetching vendor products:', productsError);
    } else if (!vendorProducts || vendorProducts.length === 0) {
      console.log('No products found for vendor');
    } else {
      console.log(`Found ${vendorProducts.length} products for this vendor`);
      const productIds = vendorProducts.map(p => p.id);
      
      // Get order_items that contain vendor products
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('produto_id', productIds);
      
      if (orderItemsError) {
        console.error('Error fetching order items for vendor products:', orderItemsError);
      } else if (orderItemsData && orderItemsData.length > 0) {
        console.log('Found', orderItemsData.length, 'order items with vendor products');
        
        // Get unique order IDs
        const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
        console.log('Found', orderIds.length, 'unique orders with vendor products');
        
        // Get product details for order items
        const { data: produtos } = await supabase
          .from('produtos')
          .select('*')
          .in('id', productIds);
          
        const productMap = {};
        if (produtos) {
          produtos.forEach(product => {
            productMap[product.id] = product;
          });
        }
        
        // Group order items by order_id
        const orderItemsMap = {};
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
        } else if (ordersData && ordersData.length > 0) {
          console.log('Successfully fetched', ordersData.length, 'orders from orders table');
          
          // Process each order to create vendor-specific view
          for (const order of ordersData) {
            // Get vendor items for this order
            const vendorItems = orderItemsMap[order.id] || [];
            
            if (vendorItems.length > 0) {
              // Calculate vendor's portion of the order
              const vendorTotal = vendorItems.reduce((sum, item) => {
                return sum + (item.total || 0);
              }, 0);
              
              // Create cliente info
              const clienteInfo: VendorCustomer = {
                id: order.cliente_id || '',
                vendedor_id: vendorProfile.id,
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
                status: order.status,
                forma_pagamento: order.forma_pagamento,
                endereco_entrega: order.endereco_entrega,
                created_at: order.created_at,
                cliente: clienteInfo,
                itens: vendorItems
              };
              
              combinedOrders.push(vendorOrder);
            }
          }
        }
      }
    }
    
    // Sort all orders by date, newest first
    combinedOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    console.log('Total combined orders:', combinedOrders.length);
    
    if (combinedOrders.length === 0) {
      console.log('Warning: No orders found for vendor. Check if vendor profile is correct and has products/orders.');
    }
    
    return combinedOrders;
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    console.log('Attempting to update order status:', id, status);
    
    // First try to update in the pedidos table
    let result = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id);
    
    if (result.error) {
      console.log('Order not found in pedidos table, trying orders table');
      // If failed, try orders table
      result = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      
      if (result.error) {
        console.error('Error updating order status in orders table:', result.error);
        throw result.error;
      } else {
        console.log('Successfully updated order status in orders table');
      }
    } else {
      console.log('Successfully updated order status in pedidos table');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};
