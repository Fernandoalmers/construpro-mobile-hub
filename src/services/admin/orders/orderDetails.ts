
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    console.log(`[OrderDetails] Starting order details fetch for ID: ${orderId}`);
    console.log(`[OrderDetails] Full order ID: ${orderId} (length: ${orderId.length})`);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      console.error(`[OrderDetails] Invalid UUID format: ${orderId}`);
      return null;
    }

    // Step 1: Get the main order data with detailed logging
    console.log(`[OrderDetails] Fetching order data from 'orders' table...`);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error(`[OrderDetails] Error fetching order:`, orderError);
      return null;
    }

    if (!orderData) {
      console.error(`[OrderDetails] No order found with ID: ${orderId}`);
      return null;
    }

    console.log(`[OrderDetails] Order found successfully:`, {
      id: orderData.id,
      status: orderData.status,
      valor_total: orderData.valor_total,
      cliente_id: orderData.cliente_id,
      data_criacao: orderData.data_criacao,
      forma_pagamento: orderData.forma_pagamento
    });

    // Step 2: Get customer information
    console.log(`[OrderDetails] Fetching customer data for ID: ${orderData.cliente_id}`);
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('nome, email, telefone')
      .eq('id', orderData.cliente_id)
      .single();

    if (customerError) {
      console.warn(`[OrderDetails] Customer fetch error:`, customerError);
    } else {
      console.log(`[OrderDetails] Customer found:`, {
        nome: customerData?.nome,
        email: customerData?.email
      });
    }

    // Step 3: Get order items with detailed logging
    console.log(`[OrderDetails] Fetching order items for order ID: ${orderId}`);
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error(`[OrderDetails] Error fetching order items:`, itemsError);
    } else {
      console.log(`[OrderDetails] Order items query result:`, {
        itemsCount: orderItems?.length || 0,
        items: orderItems?.map(item => ({
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        }))
      });
    }

    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    // Step 4: Process order items and get product/vendor details
    if (orderItems && orderItems.length > 0) {
      console.log(`[OrderDetails] Processing ${orderItems.length} order items...`);
      
      // Get all product IDs
      const productIds = orderItems.map(item => item.produto_id);
      console.log(`[OrderDetails] Product IDs to fetch:`, productIds);
      
      // Fetch all products in one query
      const { data: productsData, error: productsError } = await supabase
        .from('produtos')
        .select('id, nome, vendedor_id')
        .in('id', productIds);

      if (productsError) {
        console.error(`[OrderDetails] Error fetching products:`, productsError);
      } else {
        console.log(`[OrderDetails] Products found:`, {
          count: productsData?.length || 0,
          products: productsData?.map(p => ({
            id: p.id,
            nome: p.nome,
            vendedor_id: p.vendedor_id
          }))
        });
      }

      // Create a map for quick product lookup
      const productsMap = new Map(
        (productsData || []).map(product => [product.id, product])
      );

      // Get unique vendor IDs
      const vendorIds = [...new Set(
        (productsData || []).map(product => product.vendedor_id).filter(Boolean)
      )];
      console.log(`[OrderDetails] Vendor IDs to fetch:`, vendorIds);

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
          console.log(`[OrderDetails] Vendors found:`, {
            count: vendorsData?.length || 0,
            vendors: vendorsData?.map(v => ({
              id: v.id,
              nome_loja: v.nome_loja
            }))
          });
          vendorsMap = new Map(
            (vendorsData || []).map(vendor => [vendor.id, vendor])
          );
        }
      }

      // Process each order item with detailed logging
      for (const item of orderItems) {
        const product = productsMap.get(item.produto_id);
        const vendor = product?.vendedor_id ? vendorsMap.get(product.vendedor_id) : null;
        
        console.log(`[OrderDetails] Processing item:`, {
          item_id: item.id,
          produto_id: item.produto_id,
          product_found: !!product,
          product_name: product?.nome,
          vendor_found: !!vendor,
          vendor_name: vendor?.nome_loja,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        });
        
        // Use the first vendor found as the main vendor for the order
        if (vendor && !loja_id) {
          loja_id = vendor.id;
          loja_nome = vendor.nome_loja || 'Loja não identificada';
          console.log(`[OrderDetails] Setting main vendor:`, {
            loja_id,
            loja_nome
          });
        }

        items.push({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: product?.nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        });
      }
    } else {
      console.warn(`[OrderDetails] No order items found for order: ${orderId}`);
    }

    // Step 5: Calculate and verify totals
    const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const orderTotal = orderData.valor_total;
    const difference = Math.abs(orderTotal - calculatedTotal);
    
    console.log(`[OrderDetails] Total verification:`, {
      orderTotal,
      calculatedTotal,
      difference,
      hasDiscrepancy: difference > 0.01,
      itemsCount: items.length
    });

    // If there's a significant difference, investigate potential discounts/adjustments
    if (difference > 0.01) {
      console.warn(`[OrderDetails] Total discrepancy detected - investigating potential causes...`);
      
      // Check for coupon usage on this order
      const { data: couponUsage, error: couponError } = await supabase
        .from('coupon_usage')
        .select('discount_amount')
        .eq('order_id', orderId);

      if (!couponError && couponUsage && couponUsage.length > 0) {
        const totalDiscount = couponUsage.reduce((sum, usage) => sum + usage.discount_amount, 0);
        console.log(`[OrderDetails] Found coupon discounts:`, {
          discountCount: couponUsage.length,
          totalDiscount,
          adjustedCalculation: calculatedTotal - totalDiscount
        });
      }
    }

    // Build the final result
    const result: AdminOrder = {
      ...orderData,
      cliente_nome: customerData?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Final result summary:`, {
      orderId: result.id,
      clienteNome: result.cliente_nome,
      lojaNome: result.loja_nome,
      itemsCount: result.items?.length || 0,
      valorTotal: result.valor_total,
      status: result.status,
      forma_pagamento: result.forma_pagamento
    });

    return result;
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    return null;
  }
};
