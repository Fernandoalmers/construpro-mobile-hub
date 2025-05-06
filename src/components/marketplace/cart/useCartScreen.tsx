
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/use-cart';
import { CartItem } from '@/types/cart';

export const useCartScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeItem, refreshCart } = useCart();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  // Fetch cart data when component mounts or auth state changes
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
    }, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, navigate, refreshCart]);

  // Add debugging logs
  useEffect(() => {
    console.log("CartScreen: Cart data updated:", cart?.id);
    console.log("CartScreen: Cart items count:", cart?.items?.length || 0);
    
    if (cart?.items) {
      console.log("CartScreen: Cart items sample:", cart.items.slice(0, 2));
    }
  }, [cart]);

  // Handle quantity updates with proper error handling
  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (!item || !item.id) {
      console.error("CartScreen: Invalid item provided to handleUpdateQuantity", item);
      toast.error('Item inválido');
      return;
    }
    
    if (newQuantity < 1) {
      console.log("CartScreen: Quantity less than 1, not updating", newQuantity);
      return;
    }
    
    const maxStock = item.produto?.estoque || 0;
    if (newQuantity > maxStock) {
      toast.error(`Quantidade solicitada não disponível em estoque (máximo: ${maxStock})`);
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

  // Handle item removal with proper error handling
  const handleRemoveItem = async (itemId: string) => {
    if (!itemId) {
      console.error("CartScreen: Invalid itemId provided to handleRemoveItem");
      toast.error('ID do item inválido');
      return;
    }
    
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

  // Apply coupon code
  const applyCoupon = (code: string) => {
    if (!code) {
      toast.error('Digite um cupom válido');
      return;
    }

    // Mock coupon validation
    if (code.toUpperCase() === 'CONSTRUPROMO') {
      setAppliedCoupon({ code, discount: 10 });
      toast.success('Cupom aplicado! Desconto de 10% aplicado ao seu pedido.');
    } else if (code.toUpperCase() === 'WELCOME20') {
      setAppliedCoupon({ code, discount: 20 });
      toast.success('Cupom aplicado! Desconto de 20% aplicado ao seu pedido.');
    } else if (code.toUpperCase() === 'FRETE') {
      setAppliedCoupon({ code, discount: 5 });
      toast.success('Cupom aplicado! Desconto de 5% aplicado ao seu pedido.');
    } else {
      toast.error('O cupom informado não é válido ou expirou.');
    }
    
    setCouponCode('');
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupom removido');
  };

  // Group items by store with improved data handling
  const cartItems = cart?.items || [];
  const cartIsEmpty = cartItems.length === 0;
  
  // Improved store grouping with safety checks
  const itemsByStore = cartItems.reduce((groups: Record<string, { loja: any, items: CartItem[] }>, item) => {
    // Safety check for item and product
    if (!item || !item.produto) {
      console.warn("CartScreen: Skipping invalid item:", item);
      return groups;
    }
    
    const storeId = item.produto.loja_id;
    
    // Skip items without store ID
    if (!storeId) {
      console.warn("CartScreen: Item missing loja_id:", item);
      return groups;
    }
    
    // Create or update store group
    if (!groups[storeId]) {
      // Find store info in cart.stores
      const store = cart?.stores?.find(s => s.id === storeId);
      
      groups[storeId] = {
        loja: store || { 
          id: storeId, 
          nome: `Loja ${storeId.substring(0, 8)}`,
          logo_url: null 
        },
        items: []
      };
    }
    
    // Add item to store group
    groups[storeId].items.push(item);
    return groups;
  }, {});
  
  console.log("CartScreen: Grouped items by store:", Object.keys(itemsByStore).length);

  // Calculate totals
  const subtotal = cart?.summary.subtotal || 0;
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;
  const shipping = cart?.summary.shipping || 0;
  const total = subtotal + shipping - discount;
  const totalPoints = cart?.summary.totalPoints || 
                     Math.floor(total) * 2; // Calculate points based on total if not provided

  return {
    loading,
    error,
    cartIsEmpty,
    cart,
    cartItems,
    itemsByStore,
    processingItem,
    couponCode,
    setCouponCode,
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
