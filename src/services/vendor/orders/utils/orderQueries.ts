
import { supabase } from "@/integrations/supabase/client";

/**
 * Get vendor ID for the current user
 */
export const getVendorId = async (): Promise<string | null> => {
  const { data: vendorData, error: vendorError } = await supabase.rpc('get_vendor_id');
  
  if (vendorError || !vendorData) {
    console.error('❌ [getVendorId] Error fetching vendor ID:', vendorError);
    return null;
  }
  
  return vendorData;
};

/**
 * Get all product IDs for a vendor
 */
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  const { data: vendorProducts } = await supabase
    .from('produtos')
    .select('id')
    .eq('vendedor_id', vendorId);
  
  return vendorProducts?.map(p => p.id) || [];
};

/**
 * Get order IDs that contain products from this vendor
 */
export const getVendorOrderIds = async (vendorProductIds: string[]): Promise<string[]> => {
  if (vendorProductIds.length === 0) return [];
  
  const { data: vendorOrderIds, error: orderIdsError } = await supabase
    .from('order_items')
    .select('order_id')
    .in('produto_id', vendorProductIds);
  
  if (orderIdsError) {
    console.error('❌ [getVendorOrderIds] Error fetching vendor order IDs:', orderIdsError);
    return [];
  }
  
  return [...new Set(vendorOrderIds?.map(item => item.order_id) || [])];
};

/**
 * Fetch orders by IDs directly from orders table
 */
export const fetchOrdersByIds = async (orderIds: string[], filters: any = {}) => {
  if (orderIds.length === 0) return [];
  
  console.log(`🔍 [fetchOrdersByIds] Fetching ${orderIds.length} orders from orders table`);
  
  // Direct query to orders table without ambiguous JOINs
  let query = supabase
    .from('orders')
    .select(`
      id,
      status,
      forma_pagamento,
      valor_total,
      endereco_entrega,
      created_at,
      cliente_id,
      pontos_ganhos,
      rastreio,
      data_criacao
    `)
    .in('id', orderIds)
    .order('created_at', { ascending: false });
  
  // Apply filters safely
  if (filters.status && filters.status !== 'all') {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt('created_at', endDate.toISOString());
  }
  
  const { data: ordersData, error: ordersError } = await query;
  
  if (ordersError) {
    console.error('❌ [fetchOrdersByIds] Error fetching orders:', ordersError);
    return [];
  }
  
  console.log(`✅ [fetchOrdersByIds] Successfully fetched ${ordersData?.length || 0} orders`);
  return ordersData || [];
};

/**
 * Get order items for a specific vendor
 */
export const getVendorOrderItems = async (orderId: string, vendorProductIds: string[]) => {
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      id,
      produto_id,
      quantidade,
      preco_unitario,
      subtotal
    `)
    .eq('order_id', orderId)
    .in('produto_id', vendorProductIds);
  
  if (itemsError) {
    console.error('❌ [getVendorOrderItems] Error fetching items for order', orderId, ':', itemsError);
    return [];
  }
  
  return itemsData || [];
};

/**
 * Get product details by ID
 */
export const getProductDetails = async (productId: string) => {
  const { data: productData, error: productError } = await supabase
    .from('produtos')
    .select('nome, imagens, descricao, preco_normal, categoria')
    .eq('id', productId)
    .single();
  
  if (productError) {
    console.error('❌ [getProductDetails] Error fetching product details for', productId, ':', productError);
    return null;
  }
  
  return productData;
};
