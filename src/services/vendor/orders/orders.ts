
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

export async function getVendorOrders(filters: OrderFilters = {}): Promise<VendorOrder[]> {
  console.log("🔍 [getVendorOrders] Starting to fetch vendor orders...");
  
  try {
    // Get current user's vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .rpc('get_vendor_id');
    
    if (vendorError) {
      console.error("🚫 [getVendorOrders] Error getting vendor ID:", vendorError);
      throw vendorError;
    }
    
    if (!vendorData) {
      console.log("⚠️ [getVendorOrders] No vendor profile found for current user");
      return [];
    }
    
    console.log("🏪 [getVendorOrders] Vendor ID found:", vendorData);
    
    // Fetch pedidos with customer info and items
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        *,
        profiles!pedidos_usuario_id_fkey(nome, email, telefone)
      `)
      .eq('vendedor_id', vendorData)
      .order('created_at', { ascending: false });

    if (pedidosError) {
      console.error('🚫 [getVendorOrders] Error fetching pedidos:', pedidosError);
      throw pedidosError;
    }

    console.log(`📊 [getVendorOrders] Found ${pedidos?.length || 0} pedidos`);

    if (!pedidos || pedidos.length === 0) {
      return [];
    }

    // Transform the data to match VendorOrder interface
    const transformedOrders: VendorOrder[] = await Promise.all(
      pedidos.map(async (pedido) => {
        // Fetch items for this pedido
        const { data: items, error: itemsError } = await supabase
          .from('itens_pedido')
          .select(`
            *,
            produtos(nome, imagem_url, unidade_medida, sku, codigo_barras)
          `)
          .eq('pedido_id', pedido.id);

        if (itemsError) {
          console.error(`🚫 [getVendorOrders] Error fetching items for pedido ${pedido.id}:`, itemsError);
        }

        // Transform the pedido to match VendorOrder interface
        const transformedOrder: VendorOrder = {
          id: pedido.id,
          vendedor_id: pedido.vendedor_id,
          usuario_id: pedido.usuario_id,
          cliente_id: pedido.usuario_id, // Map usuario_id to cliente_id for compatibility
          valor_total: pedido.valor_total,
          status: pedido.status,
          forma_pagamento: pedido.forma_pagamento,
          endereco_entrega: pedido.endereco_entrega,
          created_at: pedido.created_at,
          data_entrega_estimada: pedido.data_entrega_estimada,
          cupom_codigo: pedido.cupom_codigo,
          desconto_aplicado: pedido.desconto_aplicado,
          cliente: pedido.profiles ? {
            id: pedido.usuario_id,
            vendedor_id: pedido.vendedor_id,
            usuario_id: pedido.usuario_id,
            nome: pedido.profiles.nome || 'Cliente',
            email: pedido.profiles.email,
            telefone: pedido.profiles.telefone,
            total_gasto: 0,
            ultimo_pedido: pedido.created_at,
            created_at: pedido.created_at,
            updated_at: pedido.created_at
          } : undefined,
          itens: items?.map(item => ({
            id: item.id,
            pedido_id: item.pedido_id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            total: item.total,
            created_at: item.created_at,
            produto: item.produtos
          })) || [],
          total_items: items?.length || 0
        };

        // Set items alias for compatibility
        transformedOrder.items = transformedOrder.itens;

        return transformedOrder;
      })
    );

    console.log(`✅ [getVendorOrders] Successfully transformed ${transformedOrders.length} orders`);
    
    // Log sample order structure for debugging
    if (transformedOrders.length > 0) {
      console.log("📋 [getVendorOrders] Sample transformed order:", {
        id: transformedOrders[0].id,
        status: transformedOrders[0].status,
        cliente: transformedOrders[0].cliente?.nome,
        itens_count: transformedOrders[0].itens?.length,
        valor_total: transformedOrders[0].valor_total
      });
    }

    return transformedOrders;
    
  } catch (error) {
    console.error('🚫 [getVendorOrders] Unexpected error:', error);
    throw error;
  }
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
