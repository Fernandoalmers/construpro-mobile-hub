
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from './vendorProfileService';
import { VendorCustomer } from './vendorCustomersService';

export interface OrderItem {
  id: string;
  pedido_id?: string;
  order_id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  subtotal?: number; // Added to support both orders and pedidos tables
  created_at?: string;
  produto?: any; // Using any here for simplicity
  produtos?: any; // For compatibility with the order_items structure
}

export interface VendorOrder {
  id: string;
  vendedor_id?: string;
  usuario_id?: string; // From pedidos table
  cliente_id?: string; // From orders table
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
    
    // First, try to fetch from pedidos table (old structure)
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        *
      `)
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
    if (pedidosError) {
      console.error('Error fetching vendor orders from pedidos:', pedidosError);
    }
    
    // Process pedidos to include cliente info
    const pedidosWithClienteInfo: VendorOrder[] = [];
    if (pedidosData && pedidosData.length > 0) {
      console.log('Found', pedidosData.length, 'orders in pedidos table');
      for (const pedido of pedidosData) {
        try {
          // For each pedido, get cliente info separately
          const { data: clienteData, error: clienteError } = await supabase
            .from('profiles')
            .select('id, nome, email, telefone')
            .eq('id', pedido.usuario_id)
            .maybeSingle();
          
          if (clienteError) {
            console.error('Error fetching client info:', clienteError);
          }
          
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
          
          pedidosWithClienteInfo.push({
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
    
    // Check for orders associated with vendor's products (new structure)
    // For this, we need to find orders that contain products from this vendor
    const { data: produtosVendedor, error: produtosError } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorProfile.id);
    
    if (produtosError) {
      console.error('Error fetching vendor products:', produtosError);
    }
    
    // Array to store all orders
    let combinedOrders: VendorOrder[] = [...pedidosWithClienteInfo];
    
    // If we have vendor products, fetch orders that contain these products
    if (produtosVendedor && produtosVendedor.length > 0) {
      console.log('Found', produtosVendedor.length, 'products for vendor');
      const productIds = produtosVendedor.map(product => product.id);
      
      // Get order_items that contain vendor products
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id, produto_id')
        .in('produto_id', productIds);
      
      if (orderItemsError) {
        console.error('Error fetching order items for vendor products:', orderItemsError);
      } else if (orderItemsData && orderItemsData.length > 0) {
        console.log('Found', orderItemsData.length, 'order items with vendor products');
        // Get unique order IDs
        const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
        console.log('Found', orderIds.length, 'unique orders with vendor products');
        
        // Fetch these orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .in('id', orderIds)
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          console.error('Error fetching orders for vendor products:', ordersError);
        } else if (ordersData && ordersData.length > 0) {
          console.log('Successfully fetched', ordersData.length, 'orders from orders table');
          
          // Process orders to get cliente information and produtos
          const processedOrdersPromises = ordersData.map(async (order) => {
            try {
              // Get customer information
              const { data: customerData, error: customerError } = await supabase
                .from('profiles')
                .select('id, nome, email, telefone')
                .eq('id', order.cliente_id)
                .maybeSingle();
              
              if (customerError) {
                console.error('Error fetching customer for order:', customerError);
              }
              
              // Get product information for order_items
              if (order.order_items && order.order_items.length > 0) {
                const productIds = order.order_items.map(item => item.produto_id).filter(Boolean);
                
                if (productIds.length > 0) {
                  const { data: produtos, error: productError } = await supabase
                    .from('produtos')
                    .select('*')
                    .in('id', productIds);
                  
                  if (productError) {
                    console.error('Error fetching products for order items:', productError);
                  } else if (produtos) {
                    // Only include items for products from this vendor
                    const vendorProductIds = produtosVendedor.map(p => p.id);
                    const filteredItems = order.order_items.filter(item => 
                      vendorProductIds.includes(item.produto_id)
                    );
                    
                    // Associate products with their items and format to match OrderItem structure
                    const formattedItems: OrderItem[] = filteredItems.map(item => {
                      const product = produtos.find(p => p.id === item.produto_id);
                      return {
                        id: item.id,
                        order_id: item.order_id,
                        produto_id: item.produto_id,
                        quantidade: item.quantidade,
                        preco_unitario: item.preco_unitario,
                        // Calculate total from price and quantity
                        total: item.subtotal || (item.preco_unitario * item.quantidade),
                        subtotal: item.subtotal,
                        created_at: item.created_at,
                        produtos: product, // Associate the product info
                        produto: product  // Provide both formats for compatibility
                      };
                    });
                    
                    // Only process this order if it has items from this vendor
                    if (formattedItems.length > 0) {
                      const clienteInfo: VendorCustomer = {
                        id: order.cliente_id || '',
                        vendedor_id: vendorProfile.id,
                        usuario_id: order.cliente_id,
                        nome: customerData?.nome || 'Cliente',
                        telefone: customerData?.telefone || '',
                        email: customerData?.email || '',
                        total_gasto: 0
                      };
                      
                      // Calculate vendor's portion of the order
                      const vendorTotal = formattedItems.reduce((sum, item) => {
                        return sum + item.total;
                      }, 0);
                      
                      // Create a properly structured order object
                      const vendorOrder: VendorOrder = {
                        id: order.id,
                        cliente_id: order.cliente_id,
                        valor_total: vendorTotal,
                        status: order.status,
                        forma_pagamento: order.forma_pagamento,
                        endereco_entrega: order.endereco_entrega,
                        created_at: order.created_at,
                        cliente: clienteInfo,
                        itens: formattedItems
                      };
                      
                      return vendorOrder;
                    }
                  }
                }
              }
              
              // Return null if this order doesn't have any products from this vendor
              return null;
            } catch (err) {
              console.error('Error processing order:', order.id, err);
              return null;
            }
          });
          
          // Wait for all order processing to finish
          const processedOrders = await Promise.all(processedOrdersPromises);
          
          // Filter out any null orders and add to combined orders
          const validOrders = processedOrders.filter(Boolean) as VendorOrder[];
          console.log('Processed', validOrders.length, 'valid orders for vendor');
          combinedOrders = [...combinedOrders, ...validOrders];
        }
      }
    }
    
    // Sort combined orders by creation date (newest first)
    combinedOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    console.log('Total combined orders:', combinedOrders.length);
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

// Make sure to import the toast object at the top of the file
import { toast } from '@/components/ui/sonner';
