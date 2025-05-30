
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
  }

  console.log(`[AdminOrders] Fetched ${allProfiles?.length || 0} profiles for ${clientIds.length} clients`, {
    profileTypes: allProfiles?.map(p => ({ id: p.id.substring(0, 8), tipo: p.tipo_perfil }))
  });

  return allProfiles;
};

export const fetchOrderItems = async (orderIds: string[]) => {
  const { data: allOrderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsError) {
    console.error('[AdminOrders] Error fetching order items:', itemsError);
  }

  return allOrderItems;
};

export const fetchProducts = async (productIds: string[]) => {
  const { data: allProducts, error: productsError } = await supabase
    .from('produtos')
    .select('id, nome, vendedor_id')
    .in('id', productIds);

  if (productsError) {
    console.error('[AdminOrders] Error fetching products:', productsError);
  }

  return allProducts;
};

export const fetchVendors = async (vendorIds: string[]) => {
  const { data: allVendors, error: vendorsError } = await supabase
    .from('vendedores')
    .select('id, nome_loja')
    .in('id', vendorIds);

  if (vendorsError) {
    console.error('[AdminOrders] Error fetching vendors:', vendorsError);
  }

  return allVendors;
};
