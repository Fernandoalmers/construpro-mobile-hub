
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/use-cart';
import { CartItem } from '@/types/cart';
import { toast } from '@/components/ui/sonner';
import { useStoreInfo } from '@/hooks/cart/use-store-info';
import { useCoupon } from '@/hooks/cart/use-coupon';
import { useCartTotals } from '@/hooks/cart/use-cart-totals';
import { useGroupItemsByStore } from '@/hooks/cart/use-group-items-by-store';

export const useCartScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeItem, refreshCart } = useCart();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  
  // Get cart items
  const cartItems = cart?.items || [];
  const cartIsEmpty = cartItems.length === 0;

  // Extract unique store IDs from cart items
  const storeIds = cartItems
    .map(item => item.produto?.loja_id)
    .filter((id): id is string => !!id)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Use our new custom hooks
  const { storeInfo } = useStoreInfo(storeIds);
  const { couponCode, setCouponCode, appliedCoupon, applyCoupon, removeCoupon } = useCoupon();
  const itemsByStore = useGroupItemsByStore(cartItems, storeInfo);
  
  // Calculate totals
  const storeCount = Object.keys(itemsByStore).length;
  const { subtotal, discount, shipping, total, totalPoints } = useCartTotals(
    cartItems, 
    storeCount, 
    appliedCoupon?.discount || 0,
    cart?.summary.totalPoints
  );

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
