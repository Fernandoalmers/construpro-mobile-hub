
import { supabase } from "@/integrations/supabase/client";

/**
 * Get vendor ID for the current user - FIXED: Direct query instead of RPC
 */
export const getVendorId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ [getVendorId] No authenticated user found');
      return null;
    }
    
    console.log('👤 [getVendorId] User authenticated:', user.id);
    
    // Query vendedores table directly instead of using RPC
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, status, nome_loja')
      .eq('usuario_id', user.id)
      .single();
    
    if (vendorError) {
      console.error('❌ [getVendorId] Error fetching vendor:', vendorError);
      return null;
    }
    
    if (!vendorData) {
      console.error('❌ [getVendorId] No vendor found for user:', user.id);
      return null;
    }
    
    console.log('🏪 [getVendorId] Vendor found:', {
      id: vendorData.id,
      nome_loja: vendorData.nome_loja,
      status: vendorData.status
    });
    
    return vendorData.id;
  } catch (error) {
    console.error('❌ [getVendorId] Unexpected error:', error);
    return null;
  }
};

/**
 * Get all product IDs for a vendor
 */
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  const { data: vendorProducts, error: productsError } = await supabase
    .from('produtos')
    .select('id')
    .eq('vendedor_id', vendorId);
  
  if (productsError) {
    console.error('❌ [getVendorProductIds] Error fetching vendor products:', productsError);
    return [];
  }
  
  const productIds = vendorProducts?.map(p => p.id) || [];
  console.log(`📦 [getVendorProductIds] Found ${productIds.length} products for vendor`);
  
  return productIds;
};

/**
 * Get order IDs that contain products from this vendor
 */
export const getVendorOrderIds = async (vendorProductIds: string[]): Promise<string[]> => {
  if (vendorProductIds.length === 0) {
    console.log('⚠️ [getVendorOrderIds] No products found for vendor, skipping order search');
    return [];
  }
  
  const { data: vendorOrderIds, error: orderIdsError } = await supabase
    .from('order_items')
    .select('order_id')
    .in('produto_id', vendorProductIds);
  
  if (orderIdsError) {
    console.error('❌ [getVendorOrderIds] Error fetching vendor order IDs:', orderIdsError);
    return [];
  }
  
  const uniqueOrderIds = [...new Set(vendorOrderIds?.map(item => item.order_id) || [])];
  console.log(`📦 [getVendorOrderIds] Found ${uniqueOrderIds.length} orders for vendor`);
  
  if (uniqueOrderIds.length > 0) {
    console.log('📋 [getVendorOrderIds] Sample order IDs:', uniqueOrderIds.slice(0, 3));
  }
  
  return uniqueOrderIds;
};

/**
 * Fetch orders by IDs directly from orders table - FIXED: removed ambiguous column references
 */
export const fetchOrdersByIds = async (orderIds: string[], filters: any = {}) => {
  if (orderIds.length === 0) {
    console.log('⚠️ [fetchOrdersByIds] No order IDs provided');
    return [];
  }
  
  console.log(`🔍 [fetchOrdersByIds] Fetching ${orderIds.length} orders from orders table`);
  console.log('📋 [fetchOrdersByIds] Order IDs to fetch:', orderIds.slice(0, 5));
  
  // FIXED: Use explicit table reference to avoid ambiguous column references
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
  
  // Apply filters safely - always use explicit table references
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
  
  if (ordersData && ordersData.length > 0) {
    console.log('📋 [fetchOrdersByIds] Sample order:', {
      id: ordersData[0].id,
      status: ordersData[0].status,
      cliente_id: ordersData[0].cliente_id,
      valor_total: ordersData[0].valor_total,
      created_at: ordersData[0].created_at
    });
  }
  
  return ordersData || [];
};

/**
 * Get order items for a specific vendor - FIXED: explicit table aliases
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
