
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from './vendorProfileService';
import { VendorCustomer } from './vendorCustomersService';

export interface OrderItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  created_at?: string;
  produto?: any; // Using any here for simplicity
}

export interface VendorOrder {
  id: string;
  vendedor_id: string;
  usuario_id: string;
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
    
    // Query orders
    const { data: ordersData, error: ordersError } = await supabase
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
    
    if (ordersError) {
      console.error('Error fetching vendor orders:', ordersError);
      return [];
    }
    
    if (!ordersData || ordersData.length === 0) {
      return [];
    }

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
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
            // Safely handle potentially missing cliente data
            cliente: order.cliente && typeof order.cliente === 'object' ? {
              id: (order.cliente?.id || '') as string,
              vendedor_id: vendorProfile.id,
              usuario_id: order.usuario_id,
              nome: (order.cliente?.nome || 'Cliente') as string,
              telefone: order.cliente?.telefone as string | undefined,
              email: order.cliente?.email as string | undefined,
              total_gasto: 0
            } : undefined
          };
        }
        
        return { 
          ...order, 
          itens: itemsData || [],
          // Safely handle potentially missing cliente data
          cliente: order.cliente && typeof order.cliente === 'object' ? {
            id: (order.cliente?.id || '') as string,
            vendedor_id: vendorProfile.id,
            usuario_id: order.usuario_id,
            nome: (order.cliente?.nome || 'Cliente') as string,
            telefone: order.cliente?.telefone as string | undefined,
            email: order.cliente?.email as string | undefined,
            total_gasto: 0
          } : undefined
        };
      })
    );
    
    return ordersWithItems as VendorOrder[];
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};

// Make sure to import the toast object at the top of the file
import { toast } from '@/components/ui/sonner';
