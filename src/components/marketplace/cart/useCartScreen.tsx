
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/use-cart';
import { CartItem } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';

export const useCartScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeItem, refreshCart } = useCart();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("CartScreen: User not authenticated, redirecting to login");
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    console.log("CartScreen: Refreshing cart data");
    // Explicitly refresh the cart when the component mounts
    const loadCart = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshCart();
      } catch (err) {
        console.error("Error refreshing cart:", err);
        setError("Erro ao carregar o carrinho. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
    
    // Set a periodic refresh to ensure the cart stays updated
    const intervalId = setInterval(() => {
      console.log("CartScreen: Periodic cart refresh");
      refreshCart().catch(err => console.error("Error in periodic refresh:", err));
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, navigate, refreshCart]);

  // Add debugging logs
  useEffect(() => {
    console.log("CartScreen: Cart data updated:", cart?.id);
    console.log("CartScreen: Cart items count:", cart?.items?.length || 0);
    
    if (cart?.items?.length === 0) {
      console.log("CartScreen: Cart is empty, checking for items directly from Supabase");
      const checkCartItems = async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return;
          
          // Get active cart
          const { data: cartData, error: cartError } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('status', 'active')
            .maybeSingle();
            
          if (cartError || !cartData) {
            console.log("No active cart found in direct query");
            return;
          }
          
          // Check for cart items
          const { data: cartItems, error: itemsError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('cart_id', cartData.id);
            
          console.log("[DIRECT CART CHECK]", {
            cart_id: cartData.id,
            items: cartItems?.length || 0,
            error: itemsError
          });
          
          if (cartItems && cartItems.length > 0) {
            // Get product details to verify
            const productIds = cartItems.map(item => item.product_id);
            const { data: products, error: productsError } = await supabase
              .from('produtos')
              .select('id, nome, preco_normal, preco_promocional, imagens, estoque, vendedor_id')
              .in('id', productIds);
              
            console.log("[DIRECT PRODUCTS CHECK]", {
              products: products?.length || 0,
              error: productsError
            });
            
            // Check vendor information
            if (products && products.length > 0) {
              const vendorIds = [...new Set(products.map(p => p.vendedor_id).filter(Boolean))];
              if (vendorIds.length > 0) {
                const { data: vendors, error: vendorsError } = await supabase
                  .from('vendedores')
                  .select('id, nome_loja')
                  .in('id', vendorIds);
                  
                console.log("[DIRECT VENDORS CHECK]", {
                  vendors: vendors?.length || 0,
                  error: vendorsError
                });
              }
            }
          }
        } catch (err) {
          console.error("Error in direct cart check:", err);
        }
      };
      
      checkCartItems();
    }
  }, [cart]);

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    if (newQuantity > (item.produto?.estoque || 0)) {
      toast.error('Quantidade solicitada não disponível em estoque');
      return;
    }

    try {
      setProcessingItem(item.id);
      console.log("CartScreen: Updating quantity for item:", item.id, "to", newQuantity);
      await updateQuantity(item.id, newQuantity);
      toast.success('Carrinho atualizado com sucesso');
      
      // Force a refresh to ensure UI is updated
      await refreshCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
      toast.error('Erro ao atualizar quantidade');
    } finally {
      setProcessingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setProcessingItem(itemId);
      console.log("CartScreen: Removing item:", itemId);
      await removeItem(itemId);
      toast.success('Item removido do carrinho');
      
      // Force a refresh to ensure UI is updated
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast.error('Erro ao remover item do carrinho');
    } finally {
      setProcessingItem(null);
    }
  };

  const applyCoupon = (code: string) => {
    if (!code) {
      toast.error('Digite um cupom válido');
      return;
    }

    // Mock coupon validation
    if (code.toUpperCase() === 'CONSTRUPROMO') {
      setAppliedCoupon({ code, discount: 10 });
      toast.success('Cupom aplicado! Desconto de 10% aplicado ao seu pedido.');
    } else {
      toast.error('O cupom informado não é válido ou expirou.');
    }
    
    setCouponCode('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupom removido');
  };

  // Group items by store
  const cartItems = cart?.items || [];
  const cartIsEmpty = cartItems.length === 0;
  
  // Debug log to verify the original cart items
  console.log("CartScreen: Original cart items before grouping:", cartItems);
  
  const itemsByStore = cartItems.reduce((groups: Record<string, { loja: any, items: CartItem[] }>, item) => {
    // Safety check for item and product
    if (!item || !item.produto) {
      console.warn("CartScreen: Skipping invalid item:", item);
      return groups;
    }
    
    const storeId = item.produto.loja_id;
    
    // Debug log for the current item's store_id
    console.log(`CartScreen: Processing item ${item.id} with store_id:`, storeId);
    
    if (!storeId) {
      console.warn("CartScreen: Item missing store_id:", item);
      return groups;
    }
    
    if (!groups[storeId]) {
      const store = cart?.stores?.find(s => s.id === storeId);
      if (store) {
        console.log(`CartScreen: Creating new store group for ${storeId}:`, store);
      } else {
        console.warn(`CartScreen: Store ${storeId} not found in cart.stores`);
      }
      
      groups[storeId] = {
        loja: store || { id: storeId, nome: `Loja ${storeId.substring(0, 8)}` },
        items: []
      };
    }
    
    groups[storeId].items.push(item);
    return groups;
  }, {});
  
  console.log("CartScreen: Grouped items by store:", itemsByStore);

  // Calculate discounts from coupon
  const subtotal = cart?.summary.subtotal || 0;
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;
  const shipping = cart?.summary.shipping || 0;
  const total = subtotal + shipping - discount;
  const totalPoints = cart?.summary.totalPoints || 0;

  return {
    loading,
    error,
    cartIsEmpty,
    cart,
    cartItems,
    itemsByStore,
    processingItem,
    appliedCoupon,
    subtotal,
    discount,
    shipping,
    total,
    totalPoints,
    refreshCart,
    handleUpdateQuantity,
    handleRemoveItem,
    applyCoupon,
    removeCoupon
  };
};
