
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { OrderData } from './types';

export async function getOrders(): Promise<OrderData[]> {
  try {
    console.log("🔍 [orderService.getOrders] Fetching orders for current user");
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, 
        cliente_id, 
        valor_total, 
        pontos_ganhos,
        status, 
        forma_pagamento, 
        endereco_entrega,
        created_at,
        updated_at,
        rastreio
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("❌ [orderService.getOrders] Error fetching orders:", error);
      toast.error("Não foi possível carregar seus pedidos", {
        description: error.message
      });
      throw error;
    }
    
    if (!data) {
      console.error("❌ [orderService.getOrders] No data returned");
      return [];
    }
    
    const orders = data || [];
    console.log(`✅ [orderService.getOrders] Retrieved ${orders.length} orders`);
    
    // If we have orders, log a sample to help with debugging
    if (orders.length > 0) {
      console.log("📊 [orderService.getOrders] Sample order:", {
        id: orders[0].id,
        status: orders[0].status,
        created_at: orders[0].created_at
      });
    } else {
      console.log("⚠️ [orderService.getOrders] No orders found");
    }
    
    return orders;
  } catch (error: any) {
    console.error("❌ [orderService.getOrders] Error:", error);
    toast.error("Erro ao carregar pedidos", {
      description: error.message || "Tente novamente mais tarde"
    });
    return [];
  }
}
