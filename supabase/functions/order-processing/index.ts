import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, initSupabaseClient, verifyUserToken } from './utils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = initSupabaseClient(token, true); // Use service role for transactions
    const user = await verifyUserToken(supabaseClient);

    const { action, ...body } = await req.json();

    // Handle stock validation action
    if (action === 'validate_stock') {
      return await handleStockValidation(supabaseClient, body.items);
    }

    if (action === 'create_order') {
      try {
        console.log('Received order creation request:', body);
    
        // Extract data from the request body
        const {
          items,
          endereco_entrega,
          forma_pagamento,
          valor_total,
          pontos_ganhos,
          cupom_aplicado,
          desconto,
          status
        } = body;
    
        // Validate required fields
        if (!items || !endereco_entrega || !forma_pagamento || !valor_total || !pontos_ganhos) {
          console.error('Missing required fields in request body');
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { status: 400, headers: corsHeaders }
          );
        }
    
        // Start database transaction
        const { data: transactionStart, error: transactionStartError } = await supabaseClient.rpc('begin_transaction');
        if (transactionStartError) {
          console.error('Failed to start transaction:', transactionStartError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to start transaction' }),
            { status: 500, headers: corsHeaders }
          );
        }
    
        let orderId;
        let inventoryUpdated = true;
        let pointsRegistered = true;
        let couponProcessed = true;
    
        try {
          // 1. Create the order
          const { data: orderData, error: orderError } = await supabaseClient
            .from('orders')
            .insert([{
              cliente_id: user.id,
              endereco_entrega,
              forma_pagamento,
              valor_total,
              pontos_ganhos,
              status,
              cupom_id: cupom_aplicado?.id,
              desconto: desconto || 0
            }])
            .select('id')
            .single();
    
          if (orderError) {
            console.error('Error creating order:', orderError);
            throw new Error(`Error creating order: ${orderError.message}`);
          }
    
          orderId = orderData.id;
          console.log('Order created with ID:', orderId);
    
          // 2. Create order items and update product inventory
          for (const item of items) {
            // Create order item
            const { error: itemError } = await supabaseClient
              .from('order_items')
              .insert([{
                order_id: orderId,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal,
                pontos: item.pontos || 0 // Store points per item
              }]);
    
            if (itemError) {
              console.error('Error creating order item:', itemError);
              throw new Error(`Error creating order item: ${itemError.message}`);
            }
    
            // Update product inventory
            const { error: updateError } = await supabaseClient
              .from('produtos')
              .update({ estoque: (currentStock: number) => currentStock - item.quantidade })
              .eq('id', item.produto_id);
    
            if (updateError) {
              console.error('Error updating product inventory:', updateError);
              inventoryUpdated = false; // Mark inventory update as failed
              // Do not throw error here; continue processing other items
            }
          }
    
          // 3. Register points transaction
          const { error: pointsError } = await supabaseClient
            .from('points_transactions')
            .insert([{
              user_id: user.id,
              pontos: pontos_ganhos,
              tipo: 'compra',
              descricao: `Pontos por compra #${orderId}`,
              referencia_id: orderId
            }]);
    
          if (pointsError) {
            console.error('Error registering points transaction:', pointsError);
            pointsRegistered = false; // Mark points registration as failed
            // Do not throw error here; continue processing
          }
    
          // 4. Update user total points
          const { error: updatePointsError } = await supabaseClient.rpc('update_user_points', {
            user_id: user.id,
            points_to_add: pontos_ganhos
          });
    
          if (updatePointsError) {
            console.error('Error updating total points:', updatePointsError);
            // Do not throw error; continue processing
          }
    
          // 5. Process coupon (if applicable)
          if (cupom_aplicado && desconto > 0) {
            const { error: couponError } = await supabaseClient
              .from('coupons')
              .update({ uses_left: (usesLeft: number) => usesLeft - 1 })
              .eq('id', cupom_aplicado.id);
    
            if (couponError) {
              console.error('Error updating coupon uses:', couponError);
              couponProcessed = false; // Mark coupon processing as failed
              // Do not throw error; continue processing
            }
          }
    
          // Commit transaction
          const { data: transactionCommit, error: transactionCommitError } = await supabaseClient.rpc('commit_transaction');
          if (transactionCommitError) {
            console.error('Failed to commit transaction:', transactionCommitError);
            throw new Error('Failed to commit transaction');
          }
    
          console.log('Order processing completed successfully. Order ID:', orderId);
          return new Response(
            JSON.stringify({
              success: true,
              order: { id: orderId },
              inventoryUpdated,
              pointsRegistered,
              couponProcessed
            }),
            { headers: corsHeaders }
          );
    
        } catch (error: any) {
          // Rollback transaction on any error
          console.error('Error during order processing, rolling back transaction:', error);
          const { data: transactionRollback, error: transactionRollbackError } = await supabaseClient.rpc('rollback_transaction');
          if (transactionRollbackError) {
            console.error('Failed to rollback transaction:', transactionRollbackError);
          }
    
          return new Response(
            JSON.stringify({ success: false, error: error.message || 'Order processing failed' }),
            { status: 500, headers: corsHeaders }
          );
        }
      } catch (error) {
        console.error('Error in order-processing:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Internal server error' }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

  } catch (error) {
    console.error('Error in order-processing:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// New function to handle atomic stock validation
async function handleStockValidation(supabaseClient: any, items: any[]) {
  try {
    console.log('Starting atomic stock validation for', items.length, 'items');
    
    const failedItems: string[] = [];
    
    // Use a transaction to ensure atomic validation
    const { data, error } = await supabaseClient.rpc('begin_transaction');
    if (error) {
      throw new Error('Failed to begin transaction: ' + error.message);
    }
    
    try {
      // Validate each item's stock
      for (const item of items) {
        const { data: product, error: stockError } = await supabaseClient
          .from('produtos')
          .select('id, nome, estoque')
          .eq('id', item.produto_id)
          .single();
          
        if (stockError || !product) {
          console.error('Product not found:', item.produto_id);
          failedItems.push(item.produto_id);
          continue;
        }
        
        if (product.estoque < item.quantidade) {
          console.error('Insufficient stock for product:', product.nome, 
            'requested:', item.quantidade, 'available:', product.estoque);
          failedItems.push(item.produto_id);
        }
      }
      
      // Rollback transaction since we're just validating
      await supabaseClient.rpc('rollback_transaction');
      
      if (failedItems.length > 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Alguns produtos não têm estoque suficiente',
            failedItems
          }),
          { headers: corsHeaders }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: corsHeaders }
      );
      
    } catch (error) {
      // Rollback on any error
      await supabaseClient.rpc('rollback_transaction');
      throw error;
    }
    
  } catch (error) {
    console.error('Error in stock validation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao validar estoque: ' + error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
