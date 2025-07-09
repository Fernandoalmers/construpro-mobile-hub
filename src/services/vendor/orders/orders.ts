
import { supabase } from "@/integrations/supabase/client";

export interface OrderItem {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at?: string;
}

export interface VendorOrder {
  id: string;
  usuario_id: string;
  vendedor_id: string;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  valor_total: number;
  cupom_codigo?: string;
  desconto_aplicado?: number;
  created_at: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  total_items?: number;
}

export interface OrderFilters {
  status?: string;
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
