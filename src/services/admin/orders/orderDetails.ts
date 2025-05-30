
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    console.log(`[OrderDetails] Fetching order details for ${orderId.substring(0, 8)}...`);
    
    // Step 1: Get the main order data
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
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
      cliente_id: orderData.cliente_id.substring(0, 8)
    });

    // Step 2: Get customer information
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', orderData.cliente_id)
      .single();

    if (customerError) {
      console.warn(`[OrderDetails] Customer not found:`, customerError);
    }

    // Step 3: Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error(`[OrderDetails] Error fetching order items:`, itemsError);
      return {
        ...orderData,
        cliente_nome: customerData?.nome || 'Cliente Desconhecido',
        loja_nome: 'Loja não identificada',
        items: []
      };
    }

    console.log(`[OrderDetails] Found ${orderItems?.length || 0} order items`);

    // Step 4: Get product details for each item
    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    if (orderItems && orderItems.length > 0) {
      // Get all product IDs
      const productIds = orderItems.map(item => item.produto_id);
      
      // Fetch all products in one query
      const { data: productsData, error: productsError } = await supabase
        .from('produtos')
        .select('id, nome, vendedor_id')
        .in('id', productIds);

      if (productsError) {
        console.error(`[OrderDetails] Error fetching products:`, productsError);
      }

      // Create a map for quick product lookup
      const productsMap = new Map(
        (productsData || []).map(product => [product.id, product])
      );

      // Get unique vendor IDs
      const vendorIds = [...new Set(
        (productsData || []).map(product => product.vendedor_id).filter(Boolean)
      )];

      // Fetch vendor information
      let vendorsMap = new Map();
      if (vendorIds.length > 0) {
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendedores')
          .select('id, nome_loja')
          .in('id', vendorIds);

        if (vendorsError) {
          console.error(`[OrderDetails] Error fetching vendors:`, vendorsError);
        } else {
          vendorsMap = new Map(
            (vendorsData || []).map(vendor => [vendor.id, vendor])
          );
        }
      }

      // Process each order item
      for (const item of orderItems) {
        const product = productsMap.get(item.produto_id);
        const vendor = product?.vendedor_id ? vendorsMap.get(product.vendedor_id) : null;
        
        // Use the first vendor found as the main vendor for the order
        if (vendor && !loja_id) {
          loja_id = vendor.id;
          loja_nome = vendor.nome_loja || 'Loja não identificada';
          console.log(`[OrderDetails] Setting main vendor: ${loja_nome} (${loja_id})`);
        }

        items.push({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: product?.nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        });

        console.log(`[OrderDetails] Processed item:`, {
          produto_nome: product?.nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        });
      }
    }

    // Step 5: Verify total calculation
    const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    console.log(`[OrderDetails] Total verification:`, {
      orderTotal: orderData.valor_total,
      calculatedTotal,
      difference: orderData.valor_total - calculatedTotal
    });

    // Build the final result
    const result: AdminOrder = {
      ...orderData,
      cliente_nome: customerData?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Final result:`, {
      orderId: result.id.substring(0, 8),
      clienteNome: result.cliente_nome,
      lojaNome: result.loja_nome,
      itemsCount: result.items?.length || 0,
      valorTotal: result.valor_total
    });

    return result;
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    return null;
  }
};
