
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    console.log(`[OrderDetails] Fetching order details for ${orderId.substring(0, 8)}...`);
    
    // Step 1: Get the main order data with customer info
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_cliente_id_fkey(nome)
      `)
      .eq('id', orderId)
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
      cliente_nome: orderData.profiles?.nome
    });

    // Step 2: Get order items separately
    const { data: orderItemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error(`[OrderDetails] Error fetching order items:`, itemsError);
      return {
        ...orderData,
        cliente_nome: orderData.profiles?.nome || 'Cliente Desconhecido',
        loja_nome: 'Loja não identificada',
        items: []
      };
    }

    console.log(`[OrderDetails] Found ${orderItemsData?.length || 0} order items`);

    if (!orderItemsData || orderItemsData.length === 0) {
      console.warn(`[OrderDetails] No items found for order ${orderId}`);
      return {
        ...orderData,
        cliente_nome: orderData.profiles?.nome || 'Cliente Desconhecido',
        loja_nome: 'Loja não identificada',
        items: []
      };
    }

    // Step 3: Get product IDs and fetch products separately
    const productIds = orderItemsData.map(item => item.produto_id);
    console.log(`[OrderDetails] Fetching products for IDs:`, productIds.map(id => id.substring(0, 8)));

    const { data: productsData, error: productsError } = await supabase
      .from('produtos')
      .select('id, nome, vendedor_id')
      .in('id', productIds);

    if (productsError) {
      console.error(`[OrderDetails] Error fetching products:`, productsError);
    }

    console.log(`[OrderDetails] Found ${productsData?.length || 0} products`);

    // Step 4: Get vendor IDs and fetch vendors separately
    const vendorIds = [...new Set((productsData || []).map(p => p.vendedor_id).filter(Boolean))];
    console.log(`[OrderDetails] Fetching vendors for IDs:`, vendorIds.map(id => id.substring(0, 8)));

    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendedores')
      .select('id, nome_loja')
      .in('id', vendorIds);

    if (vendorsError) {
      console.error(`[OrderDetails] Error fetching vendors:`, vendorsError);
    }

    console.log(`[OrderDetails] Found ${vendorsData?.length || 0} vendors`);

    // Step 5: Create maps for easy lookup
    const productsMap = new Map((productsData || []).map(p => [p.id, p]));
    const vendorsMap = new Map((vendorsData || []).map(v => [v.id, v]));

    // Step 6: Process items and determine main vendor
    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    for (const item of orderItemsData) {
      const produto = productsMap.get(item.produto_id);
      const vendedor = produto?.vendedor_id ? vendorsMap.get(produto.vendedor_id) : null;
      
      console.log(`[OrderDetails] Processing item:`, {
        item_id: item.id,
        produto_id: item.produto_id.substring(0, 8),
        produto_nome: produto?.nome,
        vendedor_id: produto?.vendedor_id?.substring(0, 8),
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

    // Step 7: Verify total calculation and detect discounts
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
      cliente_nome: orderData.profiles?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Final result:`, {
      orderId: result.id.substring(0, 8),
      clienteNome: result.cliente_nome,
      lojaNome: result.loja_nome,
      itemsCount: result.items?.length || 0,
      valorTotal: result.valor_total,
      hasDiscount: totalDifference > 0.01
    });

    return result;
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    return null;
  }
};
