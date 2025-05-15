
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
    
    // First, try to fetch from pedidos table (old structure)
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        *,
        cliente:usuario_id (
          id,
          nome,
          email,
          telefone
        )
      `)
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
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
    let combinedOrders: VendorOrder[] = [];
    
    // Process pedidos if any
    if (pedidosData && pedidosData.length > 0) {
      const pedidosWithItems = await Promise.all(
        pedidosData.map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('itens_pedido')
            .select(`
              *,
              produto:produto_id (*)
            `)
            .eq('pedido_id', order.id);
          
          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
            return { 
              ...order, 
              itens: [],
              cliente: {
                id: order.usuario_id || '',
                vendedor_id: vendorProfile.id,
                usuario_id: order.usuario_id,
                nome: order.cliente?.nome || 'Cliente',
                telefone: order.cliente?.telefone || '',
                email: order.cliente?.email || '',
                total_gasto: 0
              }
            };
          }
          
          const clienteData = order.cliente as any;
          const clienteInfo: VendorCustomer = {
            id: order.usuario_id || '',
            vendedor_id: vendorProfile.id,
            usuario_id: order.usuario_id,
            nome: clienteData && clienteData.nome ? clienteData.nome : 'Cliente',
            telefone: clienteData && clienteData.telefone ? clienteData.telefone : '',
            email: clienteData && clienteData.email ? clienteData.email : '',
            total_gasto: 0
          };
          
          return { 
            ...order, 
            itens: itemsData || [],
            cliente: clienteInfo
          };
        })
      );
      
      combinedOrders = [...pedidosWithItems];
    }
    
    // If we have vendor products, fetch orders that contain these products
    if (produtosVendedor && produtosVendedor.length > 0) {
      const productIds = produtosVendedor.map(product => product.id);
      
      // Get order_items that contain vendor products
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id, produto_id')
        .in('produto_id', productIds);
      
      if (orderItemsError) {
        console.error('Error fetching order items for vendor products:', orderItemsError);
      } else if (orderItemsData && orderItemsData.length > 0) {
        // Get unique order IDs
        const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
        
        // Fetch these orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .in('id', orderIds)
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          console.error('Error fetching orders for vendor products:', ordersError);
        } else if (ordersData && ordersData.length > 0) {
          // Process orders to get cliente information and produtos
          const processedOrders = await Promise.all(ordersData.map(async (order) => {
            // Get customer information
            const { data: customerData, error: customerError } = await supabase
              .from('profiles')
              .select('id, nome, email, telefone')
              .eq('id', order.cliente_id)
              .single();
            
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
                  
                  // Associate products with their items
                  filteredItems.forEach(item => {
                    item.produtos = produtos.find(p => p.id === item.produto_id) || null;
                    // Map subtotal to total for consistency
                    if (item.subtotal) {
                      item.total = item.subtotal;
                    }
                  });
                  
                  // Only process this order if it has items from this vendor
                  if (filteredItems.length > 0) {
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
                    const vendorTotal = filteredItems.reduce((sum, item) => {
                      return sum + (item.subtotal || (item.preco_unitario * item.quantidade));
                    }, 0);
                    
                    return {
                      ...order,
                      itens: filteredItems,
                      cliente: clienteInfo,
                      // Override valor_total to only show vendor's portion
                      valor_total: vendorTotal
                    };
                  }
                }
              }
            }
            
            // Return null if this order doesn't have any products from this vendor
            return null;
          }));
          
          // Filter out any null orders and add to combined orders
          const validOrders = processedOrders.filter(Boolean) as VendorOrder[];
          combinedOrders = [...combinedOrders, ...validOrders];
        }
      }
    }
    
    // Sort combined orders by creation date (newest first)
    combinedOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return combinedOrders;
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    // First try to update in the pedidos table
    let result = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id);
    
    if (result.error) {
      // If failed, try orders table
      result = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      
      if (result.error) throw result.error;
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
