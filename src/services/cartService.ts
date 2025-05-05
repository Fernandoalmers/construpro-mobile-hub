
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  produto?: {
    id: string;
    nome: string;
    preco: number;
    pontos?: number;
    imagem_url?: string;
    loja_id: string;
    estoque: number;
  };
  produto_id: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  pontos?: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  summary: {
    subtotal: number;
    shipping: number;
    totalPoints: number;
  };
  stores?: any[];
}

// Get cart function
export const getCart = async (): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // Get or create active cart
    let { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        // No active cart found, create one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ 
            user_id: userData.user.id,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating cart:', createError);
          return null;
        }

        cartData = newCart;
      } else {
        console.error('Error fetching cart:', cartError);
        return null;
      }
    }

    // Get cart items with product information from 'produtos' table
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        price_at_add,
        produtos:product_id (
          id,
          nome,
          preco_normal,
          preco_promocional,
          imagens,
          estoque,
          vendedor_id,
          pontos_consumidor
        )
      `)
      .eq('cart_id', cartData.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return null;
    }

    // Process cart items
    const cartItems: CartItem[] = (items || []).map(item => {
      // Extract first image from imagens array if available
      let imageUrl: string | undefined;
      if (item.produtos && item.produtos.imagens && Array.isArray(item.produtos.imagens) && item.produtos.imagens.length > 0) {
        // Ensure we're converting to string if the image is not already a string
        imageUrl = String(item.produtos.imagens[0]);
      }

      return {
        id: item.id,
        produto: item.produtos ? {
          id: item.produtos.id,
          nome: item.produtos.nome,
          preco: item.produtos.preco_promocional || item.produtos.preco_normal,
          pontos: item.produtos.pontos_consumidor,
          imagem_url: imageUrl,
          loja_id: item.produtos.vendedor_id,
          estoque: item.produtos.estoque || 0
        } : undefined,
        produto_id: item.product_id,
        quantidade: item.quantity,
        preco: item.price_at_add,
        subtotal: item.price_at_add * item.quantity,
        pontos: item.produtos?.pontos_consumidor
      };
    });

    // Get store information for items in cart
    const storeIds = [...new Set(cartItems.map(item => item.produto?.loja_id).filter(Boolean))];
    let stores = [];
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, nome, logo_url')
        .in('id', storeIds);

      stores = storesData || [];
    }

    // Calculate summary
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = storeIds.length * 15.9; // Fixed shipping per store
    const totalPoints = cartItems.reduce((sum, item) => sum + ((item.produto?.pontos || 0) * item.quantidade), 0);

    return {
      id: cartData.id,
      items: cartItems,
      summary: {
        subtotal,
        shipping,
        totalPoints
      },
      stores
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

// Add item to cart
export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // Get product information
    const { data: product, error: productError } = await supabase
      .from('produtos')  // Changed from 'products' to 'produtos'
      .select('id, preco_normal, preco_promocional, estoque')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return null;
    }

    // Check inventory
    if (product.estoque < quantity) {
      throw new Error(`Only ${product.estoque} items available in stock`);
    }

    // Get or create active cart
    let { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        // No active cart found, create one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ 
            user_id: userData.user.id,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating cart:', createError);
          return null;
        }

        cartData = newCart;
      } else {
        console.error('Error fetching cart:', cartError);
        return null;
      }
    }

    // Check if the product is already in the cart
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartData.id)
      .eq('product_id', productId)
      .single();

    if (existingItemError && existingItemError.code !== 'PGRST116') {
      console.error('Error checking existing items:', existingItemError);
      return null;
    }

    // Use the correct price field from the produtos table
    const productPrice = product.preco_promocional || product.preco_normal;

    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.estoque < newQuantity) {
        throw new Error(`Cannot add more items. Only ${product.estoque} available in stock`);
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return null;
      }
    } else {
      // Add new item to cart
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartData.id,
          product_id: productId,
          quantity: quantity,
          price_at_add: productPrice
        });

      if (insertError) {
        console.error('Error adding item to cart:', insertError);
        return null;
      }
    }

    // Return updated cart
    return await getCart();
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (itemId: string, quantity: number): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // Get the cart item to check against current inventory
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        produtos:product_id (estoque)
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      console.error('Error fetching cart item:', itemError);
      return null;
    }

    // Check inventory
    if (item.produtos.estoque < quantity) {
      throw new Error(`Cannot update quantity. Only ${item.produtos.estoque} available in stock`);
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (updateError) {
      console.error('Error updating quantity:', updateError);
      return null;
    }

    // Return updated cart
    return await getCart();
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId: string): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error removing cart item:', error);
      return null;
    }

    // Return updated cart
    return await getCart();
  } catch (error) {
    console.error('Error removing from cart:', error);
    return null;
  }
};

// Clear cart
export const clearCart = async (): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Get active cart
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return false;
    }

    // Delete all cart items
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartData.id);

    if (deleteError) {
      console.error('Error clearing cart:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

// Add to favorites
export const addToFavorites = async (productId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Check if already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('produto_id', productId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking favorite status:', checkError);
      return false;
    }

    // Don't add if already favorited
    if (existingFavorite) {
      return true;
    }

    // Add to favorites
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userData.user.id,
        produto_id: productId
      });

    if (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

// Check if product is favorited
export const isProductFavorited = async (productId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return false;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('produto_id', productId)
      .maybeSingle();

    if (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if product is favorited:', error);
    return false;
  }
};

// Get user favorites
export const getFavorites = async (): Promise<any[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return [];
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        data_adicionado,
        produtos:produto_id (
          id,
          nome,
          descricao,
          preco_normal,
          preco_promocional,
          imagem_url,
          categoria,
          avaliacao,
          stores:vendedor_id ( nome, id )
        )
      `)
      .eq('user_id', userData.user.id)
      .order('data_adicionado', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    // Process to match expected format
    const processedData = (data || []).map(item => {
      // First check if produtos exists and is a valid object
      if (item.produtos && typeof item.produtos === 'object' && !('error' in item.produtos)) {
        // Now it's safe to access properties and spread the item.produtos object
        return {
          ...item,
          produtos: {
            // Use type assertion to ensure TypeScript knows this is an object
            ...(item.produtos as Record<string, any>),
            // Only access properties after null checks
            preco: item.produtos.preco_promocional || item.produtos.preco_normal
          }
        };
      }
      // If produtos is not valid, return item as is without transformation
      return item;
    });

    return processedData;
  } catch (error) {
    console.error('Error in getFavorites:', error);
    return [];
  }
};

// Export cart service for use with hooks
export const cartService = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  addToFavorites,
  isProductFavorited,
  getFavorites
};
