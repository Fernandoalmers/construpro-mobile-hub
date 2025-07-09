
import { supabase } from "@/integrations/supabase/client";
import { VendorCustomer } from '../../vendorCustomersService';

export interface OrderItem {
  id: string;
  pedido_id?: string; // Legacy field
  order_id?: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  subtotal?: number;
  created_at?: string;
  produto?: any;
  produtos?: any; // Keep this for backward compatibility
}

export interface VendorOrder {
  id: string;
  vendedor_id?: string;
  usuario_id?: string; // Legacy field
  cliente_id?: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  created_at: string;
  data_criacao?: string; // Added to be compatible with both property names
  data_entrega_estimada?: string;
  pontos_ganhos?: number;
  rastreio?: string; // Made optional as it doesn't exist in the database
  cliente?: VendorCustomer;
  itens?: OrderItem[];
  items?: OrderItem[]; // Alias for itens for compatibility
  cupom_codigo?: string;
  desconto_aplicado?: number;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  total_items?: number;
}

export interface OrderFilters {
  status?: string | string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export async function getVendorOrders(filters: OrderFilters = {}) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      profiles!pedidos_usuario_id_fkey(nome, email, telefone)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor orders:', error);
    throw error;
  }

  return data;
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }

  return data;
}
