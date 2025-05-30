
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

// Helper function to validate and normalize UUID
const validateAndNormalizeUUID = (orderId: string): string => {
  const cleanId = orderId.trim();
  // Check if it's a valid UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(cleanId)) {
    console.error(`[OrderDetails] Invalid UUID format: ${cleanId}`);
    throw new Error(`Invalid UUID format: ${cleanId}`);
  }
  
  return cleanId;
};

// Fallback function using LEFT JOIN approach
const getOrderDetailsWithJoin = async (orderId: string): Promise<AdminOrder | null> => {
  console.log(`[OrderDetails] Using fallback JOIN approach for ${orderId.substring(0, 8)}...`);
  
  // First get the order data
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    console.error(`[OrderDetails] JOIN fallback failed to get order:`, orderError);
    return null;
  }

  // Get client profile explicitly (no JOIN filtering)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('nome, tipo_perfil')
    .eq('id', orderData.cliente_id)
    .single();

  if (profileError) {
    console.warn(`[OrderDetails] Could not fetch profile for client ${orderData.cliente_id}:`, profileError);
  }

  console.log(`[OrderDetails] Profile data for client:`, {
    clientId: orderData.cliente_id.substring(0, 8),
    profileFound: !!profileData,
    nome: profileData?.nome,
    tipo: profileData?.tipo_perfil
  });

  // Get order items with full JOIN
  const { data: joinData, error: joinError } = await supabase
    .from('order_items')
    .select(`
      *,
      produtos(
        id,
        nome,
        vendedor_id,
        vendedores(
          id,
          nome_loja
        )
      )
    `)
    .eq('order_id', orderId);

  if (joinError || !joinData) {
    console.error(`[OrderDetails] JOIN fallback failed to get items:`, joinError);
    return null;
  }

  console.log(`[OrderDetails] JOIN fallback data:`, {
    orderId: orderData.id.substring(0, 8),
    itemsCount: joinData?.length || 0,
    firstItem: joinData?.[0] ? {
      id: joinData[0].id,
      produto_id: joinData[0].produto_id?.substring(0, 8),
      hasProduct: !!joinData[0].produtos,
      hasVendor: !!joinData[0].produtos?.vendedores
    } : null
  });

  // Process the joined data
  const items: AdminOrderItem[] = (joinData || []).map((item: any) => ({
    id: item.id,
    produto_id: item.produto_id,
    produto_nome: item.produtos?.nome || 'Produto não encontrado',
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario,
    subtotal: item.subtotal
  }));

  // Get vendor info from first item
  let loja_nome = 'Loja não identificada';
  let loja_id: string | undefined;
  
  const firstVendor = joinData?.[0]?.produtos?.vendedores;
  if (firstVendor) {
    loja_id = joinData[0].produtos.vendedor_id;
    loja_nome = firstVendor.nome_loja;
    console.log(`[OrderDetails] JOIN fallback found vendor: ${loja_nome}`);
  }

  return {
    ...orderData,
    cliente_nome: profileData?.nome || 'Cliente Desconhecido',
    loja_id,
    loja_nome,
    items
  };
};

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    // Step 1: Validate and normalize UUID
    const normalizedOrderId = validateAndNormalizeUUID(orderId);
    console.log(`[OrderDetails] Processing order: ${normalizedOrderId.substring(0, 8)}...`);
    
    // Step 2: Get the main order data WITHOUT profile JOIN to avoid RLS issues
    console.log(`[OrderDetails] Fetching main order data...`);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', normalizedOrderId)
      .single();

    if (orderError || !orderData) {
      console.error(`[OrderDetails] Error fetching order:`, orderError);
      return null;
    }

    console.log(`[OrderDetails] Order found:`, {
      id: orderData.id.substring(0, 8),
      status: orderData.status,
      valor_total: orderData.valor_total,
      cliente_id: orderData.cliente_id.substring(0, 8),
      created_at: orderData.created_at
    });

    // Step 3: Get client profile explicitly (separate query to avoid RLS filtering)
    console.log(`[OrderDetails] Fetching client profile for ${orderData.cliente_id.substring(0, 8)}...`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('nome, tipo_perfil')
      .eq('id', orderData.cliente_id)
      .single();

    if (profileError) {
      console.warn(`[OrderDetails] Could not fetch profile:`, profileError);
    }

    console.log(`[OrderDetails] Profile data:`, {
      found: !!profileData,
      nome: profileData?.nome,
      tipo: profileData?.tipo_perfil,
      error: profileError?.message
    });

    // Step 4: Get order items with detailed logging
    console.log(`[OrderDetails] Fetching order items for order ${normalizedOrderId.substring(0, 8)}...`);
    const { data: orderItemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', normalizedOrderId);

    console.log(`[OrderDetails] Order items query result:`, {
      success: !itemsError,
      error: itemsError,
      dataCount: orderItemsData?.length || 0,
      rawData: orderItemsData
    });

    if (itemsError) {
      console.error(`[OrderDetails] Error fetching order items:`, itemsError);
      console.log(`[OrderDetails] Trying fallback JOIN approach...`);
      return getOrderDetailsWithJoin(normalizedOrderId);
    }

    if (!orderItemsData || orderItemsData.length === 0) {
      console.warn(`[OrderDetails] No items found for order ${normalizedOrderId}, trying JOIN fallback...`);
      const fallbackResult = await getOrderDetailsWithJoin(normalizedOrderId);
      if (fallbackResult && fallbackResult.items && fallbackResult.items.length > 0) {
        console.log(`[OrderDetails] JOIN fallback successful, found ${fallbackResult.items.length} items`);
        return fallbackResult;
      }
      
      // Return order without items if fallback also fails
      console.warn(`[OrderDetails] Both approaches failed to find items, returning order without items`);
      return {
        ...orderData,
        cliente_nome: profileData?.nome || 'Cliente Desconhecido',
        loja_nome: 'Loja não identificada',
        items: []
      };
    }

    console.log(`[OrderDetails] Found ${orderItemsData.length} order items:`, 
      orderItemsData.map(item => ({
        id: item.id,
        produto_id: item.produto_id.substring(0, 8),
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      }))
    );

    // Step 5: Get product details
    const productIds = orderItemsData.map(item => item.produto_id);
    console.log(`[OrderDetails] Fetching products for IDs:`, productIds.map(id => id.substring(0, 8)));

    const { data: productsData, error: productsError } = await supabase
      .from('produtos')
      .select('id, nome, vendedor_id')
      .in('id', productIds);

    console.log(`[OrderDetails] Products query result:`, {
      success: !productsError,
      error: productsError,
      dataCount: productsData?.length || 0,
      products: productsData?.map(p => ({
        id: p.id.substring(0, 8),
        nome: p.nome,
        vendedor_id: p.vendedor_id?.substring(0, 8)
      }))
    });

    if (productsError) {
      console.error(`[OrderDetails] Error fetching products:`, productsError);
    }

    // Step 6: Get vendor details
    const vendorIds = [...new Set((productsData || []).map(p => p.vendedor_id).filter(Boolean))];
    console.log(`[OrderDetails] Fetching vendors for IDs:`, vendorIds.map(id => id?.substring(0, 8)));

    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendedores')
      .select('id, nome_loja')
      .in('id', vendorIds);

    console.log(`[OrderDetails] Vendors query result:`, {
      success: !vendorsError,
      error: vendorsError,
      dataCount: vendorsData?.length || 0,
      vendors: vendorsData?.map(v => ({
        id: v.id.substring(0, 8),
        nome_loja: v.nome_loja
      }))
    });

    if (vendorsError) {
      console.error(`[OrderDetails] Error fetching vendors:`, vendorsError);
    }

    // Step 7: Create lookup maps
    const productsMap = new Map((productsData || []).map(p => [p.id, p]));
    const vendorsMap = new Map((vendorsData || []).map(v => [v.id, v]));

    console.log(`[OrderDetails] Created maps - Products: ${productsMap.size}, Vendors: ${vendorsMap.size}`);

    // Step 8: Process items and determine main vendor
    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    for (const item of orderItemsData) {
      const produto = productsMap.get(item.produto_id);
      const vendedor = produto?.vendedor_id ? vendorsMap.get(produto.vendedor_id) : null;
      
      console.log(`[OrderDetails] Processing item:`, {
        item_id: item.id,
        produto_id: item.produto_id.substring(0, 8),
        produto_found: !!produto,
        produto_nome: produto?.nome,
        vendedor_id: produto?.vendedor_id?.substring(0, 8),
        vendedor_found: !!vendedor,
        vendedor_nome: vendedor?.nome_loja
      });

      // Use the first vendor found as the main vendor for the order
      if (vendedor && vendedor.nome_loja && !loja_id) {
        loja_id = produto.vendedor_id;
        loja_nome = vendedor.nome_loja;
        console.log(`[OrderDetails] Setting main vendor: ${loja_nome} (${loja_id?.substring(0, 8)})`);
      }

      items.push({
        id: item.id,
        produto_id: item.produto_id,
        produto_nome: produto?.nome || 'Produto não encontrado',
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      });
    }

    // Step 9: Verify total calculation and detect discounts
    const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDifference = Math.abs(orderData.valor_total - calculatedTotal);
    
    console.log(`[OrderDetails] Total verification:`, {
      orderTotal: orderData.valor_total,
      calculatedTotal,
      difference: totalDifference,
      possibleDiscount: totalDifference > 0.01
    });

    // Build the final result
    const result: AdminOrder = {
      ...orderData,
      cliente_nome: profileData?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Final result:`, {
      orderId: result.id.substring(0, 8),
      clienteNome: result.cliente_nome,
      clienteTipo: profileData?.tipo_perfil,
      lojaNome: result.loja_nome,
      lojaId: result.loja_id?.substring(0, 8),
      itemsCount: result.items?.length || 0,
      valorTotal: result.valor_total,
      hasDiscount: totalDifference > 0.01,
      success: true
    });

    return result;
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    
    // Last resort: try the JOIN approach as final fallback
    try {
      console.log(`[OrderDetails] Attempting final JOIN fallback for ${orderId.substring(0, 8)}...`);
      const fallbackResult = await getOrderDetailsWithJoin(orderId);
      if (fallbackResult) {
        console.log(`[OrderDetails] Final fallback successful`);
        return fallbackResult;
      }
    } catch (fallbackError) {
      console.error('[OrderDetails] Final fallback also failed:', fallbackError);
    }
    
    return null;
  }
};
