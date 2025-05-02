
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user info for authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body;
    let action = 'get_cart';
    
    if (req.method !== 'GET') {
      try {
        body = await req.json();
        action = body.action || action;
      } catch (error) {
        console.error('Error parsing request body:', error);
      }
    }

    let result;
    switch (action) {
      case 'get_cart':
        result = await getCart(supabaseClient, user.id);
        break;
      case 'add_to_cart':
        result = await addToCart(supabaseClient, user.id, body);
        break;
      case 'update_quantity':
        result = await updateCartItemQuantity(supabaseClient, user.id, body);
        break;
      case 'remove_from_cart':
        result = await removeFromCart(supabaseClient, user.id, body);
        break;
      case 'clear_cart':
        result = await clearCart(supabaseClient, user.id);
        break;
      case 'checkout':
        result = await processCheckout(supabaseClient, user.id, body);
        break;
      case 'get_recent_products':
        result = await getRecentProducts(supabaseClient);
        break;
      case 'get_popular_products':
        result = await getPopularProducts(supabaseClient);
        break;
      case 'get_product_details':
        result = await getProductDetails(supabaseClient, body?.productId);
        break;
      case 'add_to_favorites':
        result = await addToFavorites(supabaseClient, user.id, body);
        break;
      case 'remove_from_favorites':
        result = await removeFromFavorites(supabaseClient, user.id, body);
        break;
      default:
        result = { error: 'Invalid action' };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to get or create an active cart for the user
async function getOrCreateCart(supabaseClient, userId) {
  // Check if user has an active cart
  const { data: carts, error: getCartError } = await supabaseClient
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);

  if (getCartError) {
    throw new Error(`Error fetching cart: ${getCartError.message}`);
  }

  // If there's an existing cart, return it
  if (carts && carts.length > 0) {
    return carts[0].id;
  }

  // Create a new cart if none exists
  const { data: newCart, error: createCartError } = await supabaseClient
    .from('carts')
    .insert([{ user_id: userId, status: 'active' }])
    .select('id')
    .single();

  if (createCartError) {
    throw new Error(`Error creating cart: ${createCartError.message}`);
  }

  return newCart.id;
}

// Function to get the user's cart with items
async function getCart(supabaseClient, userId) {
  try {
    // Get cart ID
    const cartId = await getOrCreateCart(supabaseClient, userId);

    // Get cart items with product details
    const { data: cartItems, error: cartItemsError } = await supabaseClient
      .from('cart_items')
      .select(`
        id, 
        quantity, 
        price_at_add,
        products(id, nome, preco, imagem_url, categoria, estoque, loja_id)
      `)
      .eq('cart_id', cartId);

    if (cartItemsError) {
      throw new Error(`Error fetching cart items: ${cartItemsError.message}`);
    }

    // Calculate cart totals
    let subtotal = 0;
    let totalPoints = 0;
    
    const items = cartItems.map(item => {
      const product = item.products;
      const itemSubtotal = item.quantity * item.price_at_add;
      
      // Assume points are 2 per dollar spent (modify as per your business logic)
      const itemPoints = Math.round(itemSubtotal * 2);
      
      subtotal += itemSubtotal;
      totalPoints += itemPoints;
      
      return {
        id: item.id,
        produtoId: product.id,
        quantidade: item.quantity,
        preco: item.price_at_add,
        subtotal: itemSubtotal,
        pontos: itemPoints,
        produto: product
      };
    });

    // Get store details for each product
    const storeIds = [...new Set(items.map(item => item.produto.loja_id))];
    const { data: stores, error: storesError } = await supabaseClient
      .from('stores')
      .select('id, nome, logo_url')
      .in('id', storeIds);

    if (storesError) {
      console.warn(`Error fetching store details: ${storesError.message}`);
    }

    // Return cart data
    return {
      cartId,
      items,
      stores: stores || [],
      summary: {
        subtotal,
        totalPoints,
        shipping: 15.90, // Default shipping, could be calculated based on stores/items
        total: subtotal + 15.90
      }
    };
  } catch (error) {
    console.error('Error in getCart:', error);
    return { error: error.message };
  }
}

// Function to add item to cart
async function addToCart(supabaseClient, userId, { productId, quantity = 1 }) {
  try {
    if (!productId) {
      return { error: 'Product ID is required' };
    }

    // Get product details
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('id, preco, estoque')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return { error: 'Product not found' };
    }

    // Check if product is in stock
    if (product.estoque < quantity) {
      return { error: 'Not enough stock available' };
    }

    // Get or create cart
    const cartId = await getOrCreateCart(supabaseClient, userId);

    // Check if item already exists in cart
    const { data: existingItems, error: checkError } = await supabaseClient
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    if (checkError) {
      throw new Error(`Error checking existing cart item: ${checkError.message}`);
    }

    let result;

    if (existingItems && existingItems.length > 0) {
      // Update existing item
      const newQuantity = existingItems[0].quantity + quantity;
      
      // Check if new quantity exceeds stock
      if (newQuantity > product.estoque) {
        return { error: 'Not enough stock available for requested quantity' };
      }

      const { data, error: updateError } = await supabaseClient
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItems[0].id)
        .select();

      if (updateError) {
        throw new Error(`Error updating cart item: ${updateError.message}`);
      }

      result = data;
    } else {
      // Add new item
      const { data, error: insertError } = await supabaseClient
        .from('cart_items')
        .insert([{
          cart_id: cartId,
          product_id: productId,
          quantity: quantity,
          price_at_add: product.preco
        }])
        .select();

      if (insertError) {
        throw new Error(`Error adding item to cart: ${insertError.message}`);
      }

      result = data;
    }

    // Get updated cart
    const updatedCart = await getCart(supabaseClient, userId);
    return { ...updatedCart, message: 'Item added to cart successfully' };
  } catch (error) {
    console.error('Error in addToCart:', error);
    return { error: error.message };
  }
}

// Function to update cart item quantity
async function updateCartItemQuantity(supabaseClient, userId, { cartItemId, quantity }) {
  try {
    if (!cartItemId || !quantity) {
      return { error: 'Cart item ID and quantity are required' };
    }

    // Verify that the cart item belongs to the user
    const { data: cartItem, error: fetchError } = await supabaseClient
      .from('cart_items')
      .select('id, product_id, cart_id')
      .eq('id', cartItemId)
      .single();

    if (fetchError || !cartItem) {
      return { error: 'Cart item not found' };
    }

    const { data: cart, error: cartError } = await supabaseClient
      .from('carts')
      .select('id')
      .eq('id', cartItem.cart_id)
      .eq('user_id', userId)
      .single();

    if (cartError || !cart) {
      return { error: 'Unauthorized access to cart item' };
    }

    // Check product stock
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('estoque')
      .eq('id', cartItem.product_id)
      .single();

    if (productError || !product) {
      return { error: 'Product not found' };
    }

    if (quantity > product.estoque) {
      return { error: 'Not enough stock available' };
    }

    // Update quantity
    const { error: updateError } = await supabaseClient
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);

    if (updateError) {
      throw new Error(`Error updating cart item: ${updateError.message}`);
    }

    // Get updated cart
    const updatedCart = await getCart(supabaseClient, userId);
    return { ...updatedCart, message: 'Cart updated successfully' };
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    return { error: error.message };
  }
}

// Function to remove item from cart
async function removeFromCart(supabaseClient, userId, { cartItemId }) {
  try {
    if (!cartItemId) {
      return { error: 'Cart item ID is required' };
    }

    // Verify that the cart item belongs to the user
    const { data: cartItem, error: fetchError } = await supabaseClient
      .from('cart_items')
      .select('cart_id')
      .eq('id', cartItemId)
      .single();

    if (fetchError || !cartItem) {
      return { error: 'Cart item not found' };
    }

    const { data: cart, error: cartError } = await supabaseClient
      .from('carts')
      .select('id')
      .eq('id', cartItem.cart_id)
      .eq('user_id', userId)
      .single();

    if (cartError || !cart) {
      return { error: 'Unauthorized access to cart item' };
    }

    // Delete cart item
    const { error: deleteError } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (deleteError) {
      throw new Error(`Error removing item from cart: ${deleteError.message}`);
    }

    // Get updated cart
    const updatedCart = await getCart(supabaseClient, userId);
    return { ...updatedCart, message: 'Item removed from cart successfully' };
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return { error: error.message };
  }
}

// Function to clear cart
async function clearCart(supabaseClient, userId) {
  try {
    // Get active cart
    const { data: cart, error: cartError } = await supabaseClient
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (cartError) {
      return { error: 'No active cart found' };
    }

    // Delete all items in cart
    const { error: deleteError } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      throw new Error(`Error clearing cart: ${deleteError.message}`);
    }

    return { message: 'Cart cleared successfully' };
  } catch (error) {
    console.error('Error in clearCart:', error);
    return { error: error.message };
  }
}

// Function to process checkout
async function processCheckout(supabaseClient, userId, { addressId, paymentMethod }) {
  try {
    if (!addressId || !paymentMethod) {
      return { error: 'Address ID and payment method are required' };
    }

    // Get cart data
    const cartData = await getCart(supabaseClient, userId);
    
    if (cartData.error || !cartData.cartId || cartData.items.length === 0) {
      return { error: 'Invalid cart or empty cart' };
    }

    // Get delivery address
    const { data: address, error: addressError } = await supabaseClient
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (addressError || !address) {
      return { error: 'Delivery address not found' };
    }

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert([{
        cliente_id: userId,
        endereco_entrega: address,
        forma_pagamento: paymentMethod,
        status: 'processando',
        valor_total: cartData.summary.total,
        pontos_ganhos: cartData.summary.totalPoints
      }])
      .select('id')
      .single();

    if (orderError) {
      throw new Error(`Error creating order: ${orderError.message}`);
    }

    // Create order items
    const orderItems = cartData.items.map(item => ({
      order_id: order.id,
      produto_id: item.produtoId,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Error creating order items: ${itemsError.message}`);
    }

    // Add points to user
    const { error: pointsError } = await supabaseClient
      .from('points_transactions')
      .insert([{
        user_id: userId,
        pontos: cartData.summary.totalPoints,
        tipo: 'compra',
        descricao: `Pontos por compra #${order.id}`,
        referencia_id: order.id
      }]);

    if (pointsError) {
      console.warn(`Error adding points: ${pointsError.message}`);
    }

    // Update user total points
    const { error: updatePointsError } = await supabaseClient.rpc('update_user_points', {
      user_id: userId,
      points_to_add: cartData.summary.totalPoints
    });

    if (updatePointsError) {
      console.warn(`Error updating total points: ${updatePointsError.message}`);
    }

    // Mark cart as converted
    const { error: updateCartError } = await supabaseClient
      .from('carts')
      .update({ status: 'converted' })
      .eq('id', cartData.cartId);

    if (updateCartError) {
      console.warn(`Error updating cart status: ${updateCartError.message}`);
    }

    return { 
      success: true, 
      orderId: order.id,
      message: 'Order placed successfully',
      pointsEarned: cartData.summary.totalPoints
    };
  } catch (error) {
    console.error('Error in processCheckout:', error);
    return { error: error.message };
  }
}

async function getRecentProducts(supabaseClient) {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Error fetching recent products: ${error.message}`);
    }

    return { products: data };
  } catch (error) {
    console.error('Error in getRecentProducts:', error);
    return { error: error.message };
  }
}

async function getPopularProducts(supabaseClient) {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('avaliacao', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Error fetching popular products: ${error.message}`);
    }

    return { products: data };
  } catch (error) {
    console.error('Error in getPopularProducts:', error);
    return { error: error.message };
  }
}

async function getProductDetails(supabaseClient, productId) {
  try {
    if (!productId) {
      return { error: 'Product ID is required' };
    }

    const { data: product, error } = await supabaseClient
      .from('products')
      .select(`
        *,
        product_reviews(*)
      `)
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error(`Error fetching product details: ${error.message}`);
    }

    // Get store information
    const { data: store, error: storeError } = await supabaseClient
      .from('stores')
      .select('*')
      .eq('id', product.loja_id)
      .single();

    if (storeError) {
      console.warn(`Error fetching store information: ${storeError.message}`);
    }

    return { 
      product,
      store: store || null
    };
  } catch (error) {
    console.error('Error in getProductDetails:', error);
    return { error: error.message };
  }
}

async function addToFavorites(supabaseClient, userId, { productId }) {
  try {
    if (!productId) {
      return { error: 'Product ID is required' };
    }

    // Check if the favorite already exists
    const { data: existingFavorite, error: checkError } = await supabaseClient
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('produto_id', productId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Error checking favorites: ${checkError.message}`);
    }

    if (existingFavorite) {
      return { message: 'Product is already in favorites' };
    }

    // Add to favorites
    const { error: insertError } = await supabaseClient
      .from('favorites')
      .insert([{
        user_id: userId,
        produto_id: productId
      }]);

    if (insertError) {
      throw new Error(`Error adding to favorites: ${insertError.message}`);
    }

    return { success: true, message: 'Added to favorites successfully' };
  } catch (error) {
    console.error('Error in addToFavorites:', error);
    return { error: error.message };
  }
}

async function removeFromFavorites(supabaseClient, userId, { productId }) {
  try {
    if (!productId) {
      return { error: 'Product ID is required' };
    }

    const { error } = await supabaseClient
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('produto_id', productId);

    if (error) {
      throw new Error(`Error removing from favorites: ${error.message}`);
    }

    return { success: true, message: 'Removed from favorites successfully' };
  } catch (error) {
    console.error('Error in removeFromFavorites:', error);
    return { error: error.message };
  }
}
