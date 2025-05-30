
import { supabase } from '@/integrations/supabase/client';
import { FetchOrdersParams } from './types';

export const buildOrdersQuery = (params: FetchOrdersParams) => {
  const { page = 1, limit = 25, status } = params;
  const offset = (page - 1) * limit;

  console.log(`[AdminOrders] Building query - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

  let baseQuery = supabase
    .from('orders')
    .select(`
      id,
      cliente_id,
      valor_total,
      status,
      forma_pagamento,
      data_criacao,
      created_at,
      endereco_entrega,
      rastreio,
      pontos_ganhos
    `, { count: 'exact' })
    .order('data_criacao', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'all') {
    baseQuery = baseQuery.eq('status', status);
  }

  return baseQuery;
};

export const fetchClientProfiles = async (clientIds: string[]) => {
  console.log(`[AdminOrders] Fetching ${clientIds.length} client profiles explicitly...`);
  
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, nome, tipo_perfil')
    .in('id', clientIds);

  if (profilesError) {
    console.error('[AdminOrders] Error fetching profiles:', profilesError);
    throw new Error(`Failed to fetch client profiles: ${profilesError.message}`);
  }

  console.log(`[AdminOrders] Fetched ${allProfiles?.length || 0} profiles for ${clientIds.length} clients`, {
    profileTypes: allProfiles?.map(p => ({ id: p.id.substring(0, 8), tipo: p.tipo_perfil }))
  });

  return allProfiles;
};

export const fetchOrderItems = async (orderIds: string[]) => {
  console.log(`[AdminOrders] Fetching order items for ${orderIds.length} orders...`);
  
  const { data: allOrderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsError) {
    console.error('[AdminOrders] Error fetching order items:', itemsError);
    throw new Error(`Failed to fetch order items: ${itemsError.message}`);
  }

  console.log(`[AdminOrders] Successfully fetched ${allOrderItems?.length || 0} order items`, {
    itemsBreakdown: allOrderItems?.reduce((acc, item) => {
      acc[item.order_id] = (acc[item.order_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });

  return allOrderItems;
};

export const fetchProducts = async (productIds: string[]) => {
  if (productIds.length === 0) {
    console.log('[AdminOrders] No product IDs to fetch');
    return [];
  }

  console.log(`[AdminOrders] Fetching ${productIds.length} products...`);
  
  const { data: allProducts, error: productsError } = await supabase
    .from('produtos')
    .select('id, nome, vendedor_id')
    .in('id', productIds);

  if (productsError) {
    console.error('[AdminOrders] Error fetching products:', productsError);
    throw new Error(`Failed to fetch products: ${productsError.message}`);
  }

  console.log(`[AdminOrders] Successfully fetched ${allProducts?.length || 0} products`);

  return allProducts;
};

export const fetchVendors = async (vendorIds: string[]) => {
  if (vendorIds.length === 0) {
    console.log('[AdminOrders] No vendor IDs to fetch');
    return [];
  }

  console.log(`[AdminOrders] Fetching ${vendorIds.length} vendors...`);
  
  const { data: allVendors, error: vendorsError } = await supabase
    .from('vendedores')
    .select('id, nome_loja')
    .in('id', vendorIds);

  if (vendorsError) {
    console.error('[AdminOrders] Error fetching vendors:', vendorsError);
    throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
  }

  console.log(`[AdminOrders] Successfully fetched ${allVendors?.length || 0} vendors`);

  return allVendors;
};
