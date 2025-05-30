
import { supabase } from '@/integrations/supabase/client';
import { securityService } from '@/services/securityService';
import { config } from '@/config/environment';
import { toast } from '@/components/ui/sonner';

interface SecureCartItem {
  productId: string;
  quantity: number;
  priceAtAdd: number;
}

class SecureCartService {
  // Secure add to cart with validation and rate limiting
  async addToCart(item: SecureCartItem): Promise<boolean> {
    try {
      // Rate limiting check
      const rateLimitKey = `cart_add_${item.productId}`;
      if (!securityService.checkRateLimit(rateLimitKey, config.security.rateLimit.maxCartUpdates, config.security.rateLimit.cartWindowMs)) {
        toast.error('Muitas tentativas. Tente novamente em alguns momentos.');
        await securityService.logSecurityEvent('cart_rate_limit_exceeded', {
          product_id: item.productId,
          attempted_quantity: item.quantity
        });
        return false;
      }

      // Validate quantity
      if (!securityService.validateCartQuantity(item.quantity)) {
        toast.error('Quantidade inválida. Deve ser entre 1 e 1000.');
        await securityService.logSecurityEvent('cart_invalid_quantity', {
          product_id: item.productId,
          attempted_quantity: item.quantity
        });
        return false;
      }

      // Verify product exists and get current price
      const { data: product, error: productError } = await supabase
        .from('produtos')
        .select('id, preco_normal, preco_promocional, estoque')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        toast.error('Produto não encontrado.');
        await securityService.logSecurityEvent('cart_invalid_product', {
          product_id: item.productId,
          error: productError?.message
        });
        return false;
      }

      // Check stock availability
      if (product.estoque < item.quantity) {
        toast.error('Estoque insuficiente.');
        await securityService.logSecurityEvent('cart_insufficient_stock', {
          product_id: item.productId,
          requested_quantity: item.quantity,
          available_stock: product.estoque
        });
        return false;
      }

      // Use current price, not the price passed by client
      const currentPrice = product.preco_promocional || product.preco_normal;

      // Get or create cart
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado.');
        return false;
      }

      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (cartError && cartError.code !== 'PGRST116') {
        console.error('Error fetching cart:', cartError);
        return false;
      }

      if (!cart) {
        const { data: newCart, error: createCartError } = await supabase
          .from('carts')
          .insert({ user_id: user.id, status: 'active' })
          .select('id')
          .single();

        if (createCartError) {
          console.error('Error creating cart:', createCartError);
          return false;
        }
        cart = newCart;
      }

      // Add item to cart with validated data
      const { error: addItemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: item.productId,
          quantity: item.quantity,
          price_at_add: currentPrice
        });

      if (addItemError) {
        console.error('Error adding item to cart:', addItemError);
        toast.error('Erro ao adicionar item ao carrinho.');
        return false;
      }

      await securityService.logSecurityEvent('cart_item_added', {
        product_id: item.productId,
        quantity: item.quantity,
        price_at_add: currentPrice
      });

      toast.success('Item adicionado ao carrinho com sucesso!');
      return true;

    } catch (error) {
      console.error('Exception in addToCart:', error);
      await securityService.logSecurityEvent('cart_add_exception', {
        product_id: item.productId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Erro interno ao adicionar item ao carrinho.');
      return false;
    }
  }

  // Secure quantity update with validation
  async updateQuantity(cartItemId: string, newQuantity: number): Promise<boolean> {
    try {
      // Validate quantity
      if (!securityService.validateCartQuantity(newQuantity)) {
        toast.error('Quantidade inválida. Deve ser entre 1 e 1000.');
        return false;
      }

      // Rate limiting
      if (!securityService.checkRateLimit(`cart_update_${cartItemId}`, config.security.rateLimit.maxCartUpdates, config.security.rateLimit.cartWindowMs)) {
        toast.error('Muitas atualizações. Tente novamente em alguns momentos.');
        return false;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      if (error) {
        console.error('Error updating cart item:', error);
        return false;
      }

      await securityService.logSecurityEvent('cart_quantity_updated', {
        cart_item_id: cartItemId,
        new_quantity: newQuantity
      });

      return true;
    } catch (error) {
      console.error('Exception updating cart quantity:', error);
      await securityService.logSecurityEvent('cart_update_exception', {
        cart_item_id: cartItemId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

export const secureCartService = new SecureCartService();
