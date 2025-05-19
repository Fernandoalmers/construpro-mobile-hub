
import { corsHeaders, initSupabaseClient, verifyUserToken } from './utils.ts'
import { Order } from './types.ts'

// Helper function to capitalize the first letter of order status
function capitalizeOrderStatus(status: string): string {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Helper function to update product inventory
async function updateProductInventory(supabaseClient: any, items: any[]): Promise<void> {
  console.log("Updating product inventory for order items:", items);
  
  for (const item of items) {
    if (!item.produto_id || !item.quantidade) {
      console.warn("Missing product_id or quantity for item:", item);
      continue;
    }
    
    try {
      // Get current product stock
      const { data: product, error: productError } = await supabaseClient
        .from('produtos')
        .select('estoque, nome')
        .eq('id', item.produto_id)
        .single();
      
      if (productError) {
        console.error(`Error fetching product ${item.produto_id}:`, productError);
        continue;
      }
      
      if (!product) {
        console.error(`Product ${item.produto_id} not found`);
        continue;
      }
      
      const currentStock = product.estoque || 0;
      const newStock = Math.max(0, currentStock - item.quantidade);
      
      console.log(`Updating product ${product.nome} (${item.produto_id}) stock: ${currentStock} -> ${newStock}`);
      
      // Update product stock
      const { error: updateError } = await supabaseClient
        .from('produtos')
        .update({ estoque: newStock })
        .eq('id', item.produto_id);
      
      if (updateError) {
        console.error(`Error updating product ${item.produto_id} stock:`, updateError);
      }
    } catch (error) {
      console.error(`Error processing inventory update for product ${item.produto_id}:`, error);
    }
  }
}

// Helper function to get total points from order items
async function calculateOrderPoints(supabaseClient: any, items: any[], userType: string = 'consumidor'): Promise<number> {
  console.log("Calculating points for order items with user type:", userType);
  let totalPoints = 0;
  
  try {
    // Fetch all product IDs at once for better performance
    const productIds = items.map(item => item.produto_id).filter(Boolean);
    
    if (productIds.length === 0) {
      console.warn("No valid product IDs found in order items");
      return 0;
    }
    
    const { data: products, error } = await supabaseClient
      .from('produtos')
      .select('id, pontos_consumidor, pontos_profissional')
      .in('id', productIds);
    
    if (error) {
      console.error("Error fetching product points data:", error);
      return 0;
    }
    
    if (!products || products.length === 0) {
      console.warn("No products found for points calculation");
      return 0;
    }
    
    // Create a mapping of product ID to points info
    const productPointsMap = products.reduce((acc, product) => {
      acc[product.id] = {
        consumerPoints: product.pontos_consumidor || 0,
        professionalPoints: product.pontos_profissional || 0
      };
      return acc;
    }, {});
    
    // Sum points for all items based on user type
    items.forEach(item => {
      if (item.produto_id && productPointsMap[item.produto_id]) {
        const pointsInfo = productPointsMap[item.produto_id];
        const pointsPerUnit = userType === 'profissional' 
          ? pointsInfo.professionalPoints 
          : pointsInfo.consumerPoints;
        
        totalPoints += (pointsPerUnit * item.quantidade);
      }
    });
    
    console.log(`Total points calculated for order: ${totalPoints}`);
    return totalPoints;
    
  } catch (error) {
    console.error("Error in calculateOrderPoints:", error);
    return 0;
  }
}

export async function handleGetOrders(req: Request, authHeader: string) {
  try {
    console.log("Getting orders for authenticated user");
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = initSupabaseClient(token)
    const user = await verifyUserToken(supabaseClient)
    
    console.log(`User authenticated successfully: ${user.id}`);
    
    // Improved query with better error handling and diagnostic info
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false })
    
    console.log(`Retrieved ${orders?.length || 0} orders for user ${user.id}`);
    
    if (error) {
      console.error("Error fetching orders:", error);
      console.error("Error code:", error.code);
      console.error("Error details:", error.details);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message,
          details: error.details,
          code: error.code
        }),
        { status: 500, headers: corsHeaders }
      )
    }
    
    // If we have no orders, log additional diagnostic info and return early
    if (!orders || orders.length === 0) {
      console.log("No orders found, retrieving user profile info for diagnostic purposes");
      
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, nome, email, papel')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error("Error fetching profile info:", profileError);
      } else {
        console.log("User profile:", profile);
      }
      
      // Check if the user has any order items at all (debugging)
      const { data: anyOrderItems, error: itemsError } = await supabaseClient
        .from('order_items')
        .select('count')
        .limit(1);
        
      if (itemsError) {
        console.error("Error checking for order items:", itemsError);
      } else {
        console.log("Order items exist in database:", anyOrderItems && anyOrderItems.length > 0);
      }
      
      // Return empty orders array with diagnostic info
      return new Response(
        JSON.stringify({ 
          success: true,
          orders: [],
          diagnostic: {
            message: "No orders found for user",
            userId: user.id,
            timestamp: new Date().toISOString()
          }
        }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // If we have orders with items, fetch the product details separately
    if (orders && orders.length > 0) {
      console.log(`Found ${orders.length} orders, processing order items and products`);
      
      // Get all product IDs from order items
      const productIds = new Set();
      let itemsCount = 0;
      
      orders.forEach(order => {
        if (order.order_items) {
          itemsCount += order.order_items.length;
          order.order_items.forEach(item => {
            if (item.produto_id) {
              productIds.add(item.produto_id);
            }
          });
        }
      });
      
      console.log(`Found ${itemsCount} order items across all orders`);
      console.log(`Found ${productIds.size} unique products to fetch`);
      
      if (productIds.size > 0) {
        // Fetch product details for these IDs
        const { data: produtos, error: productError } = await supabaseClient
          .from('produtos')
          .select('*')
          .in('id', Array.from(productIds));
        
        if (productError) {
          console.error("Error fetching product details:", productError);
        } else if (produtos) {
          console.log(`Retrieved ${produtos.length} products from produtos table`);
          
          // Map products to order items
          orders.forEach(order => {
            if (order.order_items) {
              order.order_items.forEach(item => {
                const matchedProduct = produtos.find(p => p.id === item.produto_id);
                if (matchedProduct) {
                  item.produtos = matchedProduct;
                } else {
                  console.log(`No product found for item ${item.id} with produto_id ${item.produto_id}`);
                }
              });
            }
          });
        }
      }
    }
    
    // Final validation and logging
    console.log(`Returning ${orders?.length || 0} orders with their details`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        orders,
        metadata: {
          count: orders?.length || 0,
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error("Authorization error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error fetching orders',
        stack: error.stack || 'No stack trace available'
      }),
      { status: 401, headers: corsHeaders }
    )
  }
}

export async function handleGetOrderById(req: Request, authHeader: string, orderId: string) {
  try {
    console.log(`Getting order details for ID: ${orderId}`);
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = initSupabaseClient(token)
    const user = await verifyUserToken(supabaseClient)
    
    console.log(`User authenticated successfully: ${user.id}`);
    
    // Improved query with better error handling
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('cliente_id', user.id)
      .single()
    
    if (error) {
      console.error("Error fetching order by ID:", error);
      console.error("Error code:", error.code);
      console.error("Error details:", error.details);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message,
          details: error.details,
          code: error.code
        }),
        { status: error.code === 'PGRST116' ? 404 : 500, headers: corsHeaders }
      )
    }
    
    // If we found the order but it has no items, log a warning
    if (order && (!order.order_items || order.order_items.length === 0)) {
      console.log(`Order ${orderId} found but has no items`);
    }
    
    // If we have order items, fetch the product details
    if (order && order.order_items && order.order_items.length > 0) {
      const productIds = order.order_items
        .map(item => item.produto_id)
        .filter(Boolean);
      
      console.log(`Order ${orderId} has ${order.order_items.length} items with ${productIds.length} product IDs`);
      
      if (productIds.length > 0) {
        // Fetch product details for these IDs
        const { data: produtos, error: productError } = await supabaseClient
          .from('produtos')
          .select('*')
          .in('id', productIds);
        
        if (productError) {
          console.error("Error fetching product details:", productError);
        } else if (produtos) {
          console.log(`Retrieved ${produtos.length} products for order ${orderId}`);
          
          // Map products to order items
          order.order_items.forEach(item => {
            const matchedProduct = produtos.find(p => p.id === item.produto_id);
            if (matchedProduct) {
              item.produtos = matchedProduct;
            } else {
              console.log(`No product found for item with produto_id ${item.produto_id}`);
            }
          });
        }
      }
    }
    
    console.log(`Retrieved order ${order.id} successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        order,
        metadata: {
          itemsCount: order?.order_items?.length || 0,
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error("Authorization error on get order by ID:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error fetching order',
        stack: error.stack || 'No stack trace available'
      }),
      { status: 401, headers: corsHeaders }
    )
  }
}

export async function handleCreateOrder(req: Request, authHeader: string) {
  try {
    console.log("Starting order creation process");
    const token = authHeader.replace('Bearer ', '')
    
    // First verify the user with the regular client
    const regularClient = initSupabaseClient(token)
    const user = await verifyUserToken(regularClient)
    console.log(`User authenticated successfully: ${user.id}`);
    
    // Get user profile to determine if they are a consumer or professional
    const { data: userProfile, error: profileError } = await regularClient
      .from('profiles')
      .select('papel, tipo_perfil')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }
    
    const userType = userProfile?.papel || userProfile?.tipo_perfil || 'consumidor';
    console.log(`User type determined as: ${userType}`);
    
    // For database operations that might face RLS issues, use the service role client
    // The service role bypasses RLS policies entirely
    const serviceRoleClient = initSupabaseClient(token, true)
    
    const orderData: Order = await req.json()
    console.log("Processing order data:", JSON.stringify(orderData));
    
    // Properly capitalize the status field to match database constraint
    if (orderData.status) {
      orderData.status = capitalizeOrderStatus(orderData.status);
    } else {
      // Default status if none provided
      orderData.status = "Confirmado";
    }
    
    try {
      console.log(`Creating order for user: ${user.id}`);
      
      // Calculate product-specific points instead of using percentage of order total
      let pontos_ganhos = orderData.pontos_ganhos;
      
      // If points weren't explicitly provided or calculated correctly in the frontend,
      // calculate them here based on the products in the order
      if (!pontos_ganhos || pontos_ganhos <= 0) {
        pontos_ganhos = await calculateOrderPoints(serviceRoleClient, orderData.items, userType);
        console.log(`Calculated points from products: ${pontos_ganhos}`);
      } else {
        console.log(`Using points provided from frontend: ${pontos_ganhos}`);
        
        // Double-check the points for debugging purposes
        const calculatedPoints = await calculateOrderPoints(serviceRoleClient, orderData.items, userType);
        if (calculatedPoints !== pontos_ganhos) {
          console.warn(`Warning: Points mismatch. Frontend: ${pontos_ganhos}, Calculated: ${calculatedPoints}`);
          // Use the calculated points as the correct value
          pontos_ganhos = calculatedPoints;
        }
      }
      
      // Create order with explicit user ID to satisfy RLS (but using service role to bypass RLS)
      console.log("Inserting order record with points:", pontos_ganhos);
      const orderInsertData = {
        cliente_id: user.id,
        valor_total: orderData.valor_total,
        pontos_ganhos: pontos_ganhos,
        status: orderData.status,
        forma_pagamento: orderData.forma_pagamento,
        rastreio: orderData.rastreio,
        endereco_entrega: orderData.endereco_entrega,
      };
      
      console.log("Order insert data:", JSON.stringify(orderInsertData));
      
      const { data: order, error: orderError } = await serviceRoleClient
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();
      
      if (orderError) {
        console.error("Order creation error:", orderError);
        
        // Enhanced error logging
        console.error("Error code:", orderError.code);
        console.error("Error details:", orderError.details);
        console.error("Error hint:", orderError.hint);
        
        throw new Error(`Order creation error: ${orderError.message}`);
      }
      
      console.log("Order created successfully:", order?.id);
      
      // Create order items
      console.log("Creating order items");
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      }));
      
      const { error: itemsError } = await serviceRoleClient
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error("Order items error:", itemsError);
        throw new Error(`Order items error: ${itemsError.message}`);
      }
      
      console.log("Order items created successfully");
      
      // Update product inventory - new functionality
      await updateProductInventory(serviceRoleClient, orderData.items);
      console.log("Product inventory updated successfully");
      
      // Add points transaction
      console.log("Creating points transaction with points:", pontos_ganhos);
      const { error: pointsError } = await serviceRoleClient
        .from('points_transactions')
        .insert({
          user_id: user.id,
          pontos: pontos_ganhos,
          tipo: 'compra',
          referencia_id: order.id,
          descricao: `Pontos ganhos na compra #${order.id.substring(0,8)}`
        });
      
      if (pointsError) {
        console.error("Points transaction error:", pointsError);
        throw new Error(`Points transaction error: ${pointsError.message}`);
      }
      
      console.log("Points transaction created successfully");
      
      // Update user points balance
      console.log("Updating user points balance");
      const { error: profileError } = await serviceRoleClient
        .rpc('update_user_points', { 
          user_id: user.id, 
          points_to_add: pontos_ganhos 
        });
      
      if (profileError) {
        console.error("Update points error:", profileError);
        throw new Error(`Update points error: ${profileError.message}`);
      }
      
      console.log("User points updated successfully");
      
      return new Response(
        JSON.stringify({
          success: true,
          order: {
            ...order,
            items: orderData.items
          }
        }),
        { status: 201, headers: corsHeaders }
      );
    } catch (error: any) {
      console.error("Order creation error:", error);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message || 'Erro ao processar pedido',
          details: error.toString(),
          code: error.code || 'PROCESSING_ERROR'
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Authorization error on create order:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error processing order',
        details: error.toString(),
        code: 'AUTH_ERROR'
      }),
      { status: 401, headers: corsHeaders }
    )
  }
}
