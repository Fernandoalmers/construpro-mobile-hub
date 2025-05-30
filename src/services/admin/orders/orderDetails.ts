
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

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    // Step 1: Validate and normalize UUID
    const normalizedOrderId = validateAndNormalizeUUID(orderId);
    console.log(`[OrderDetails] Processing order: ${normalizedOrderId.substring(0, 8)}...`);
    
    // Step 2: Get the main order data
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
      cliente_id: orderData.cliente_id.substring(0, 8)
    });

    // Step 3: Get client profile
    console.log(`[OrderDetails] Fetching client profile...`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('nome, tipo_perfil')
      .eq('id', orderData.cliente_id)
      .single();

    if (profileError) {
      console.warn(`[OrderDetails] Could not fetch profile:`, profileError);
    }

    // Step 4: Get order items with the new RLS policy in place
    console.log(`[OrderDetails] Fetching order items...`);
    const { data: orderItemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', normalizedOrderId);

    if (itemsError) {
      console.error(`[OrderDetails] Error fetching order items:`, itemsError);
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    console.log(`[OrderDetails] Found ${orderItemsData?.length || 0} order items`);

    if (!orderItemsData || orderItemsData.length === 0) {
      console.warn(`[OrderDetails] No items found for order ${normalizedOrderId}`);
      // Return order without items but don't fail
      return {
        ...orderData,
        cliente_nome: profileData?.nome || 'Cliente Desconhecido',
        loja_nome: 'Loja não identificada',
        items: []
      };
    }

    // Step 5: Get product details
    const productIds = orderItemsData.map(item => item.produto_id);
    console.log(`[OrderDetails] Fetching ${productIds.length} products...`);

    const { data: productsData, error: productsError } = await supabase
      .from('produtos')
      .select('id, nome, vendedor_id')
      .in('id', productIds);

    if (productsError) {
      console.error(`[OrderDetails] Error fetching products:`, productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Step 6: Get vendor details
    const vendorIds = [...new Set((productsData || []).map(p => p.vendedor_id).filter(Boolean))];
    console.log(`[OrderDetails] Fetching ${vendorIds.length} vendors...`);

    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendedores')
      .select('id, nome_loja')
      .in('id', vendorIds);

    if (vendorsError) {
      console.error(`[OrderDetails] Error fetching vendors:`, vendorsError);
      throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
    }

    // Step 7: Create lookup maps
    const productsMap = new Map((productsData || []).map(p => [p.id, p]));
    const vendorsMap = new Map((vendorsData || []).map(v => [v.id, v]));

    // Step 8: Process items and determine main vendor
    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    for (const item of orderItemsData) {
      const produto = productsMap.get(item.produto_id);
      const vendedor = produto?.vendedor_id ? vendorsMap.get(produto.vendedor_id) : null;
      
      // Use the first vendor found as the main vendor for the order
      if (vendedor && vendedor.nome_loja && !loja_id) {
        loja_id = produto.vendedor_id;
        loja_nome = vendedor.nome_loja;
        console.log(`[OrderDetails] Setting main vendor: ${loja_nome}`);
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

    // Step 9: Build the final result
    const result: AdminOrder = {
      ...orderData,
      cliente_nome: profileData?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Successfully processed order:`, {
      orderId: result.id.substring(0, 8),
      clienteNome: result.cliente_nome,
      clienteTipo: profileData?.tipo_perfil,
      lojaNome: result.loja_nome,
      itemsCount: result.items?.length || 0,
      valorTotal: result.valor_total
    });

    return result;
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    throw error;
  }
};
