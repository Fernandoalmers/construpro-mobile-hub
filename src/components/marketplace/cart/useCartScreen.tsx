
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/use-cart';
import { CartItem } from '@/types/cart';
import { toast } from '@/components/ui/sonner';
import { useStoreInfo } from '@/hooks/cart/use-store-info';
import { useCoupon } from '@/hooks/cart/use-coupon';
import { useCartTotals } from '@/hooks/cart/use-cart-totals';
import { useGroupItemsByStore, storeGroupsToArray } from '@/hooks/cart/use-group-items-by-store';

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

  // Extract unique store IDs from cart items using useMemo
  const storeIds = useMemo(() => {
    return cartItems
      .map(item => item.produto?.loja_id)
      .filter((id): id is string => !!id)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [cartItems]);

  // Use our custom hooks
  const { storeInfo } = useStoreInfo(storeIds);
  const { couponCode, setCouponCode, appliedCoupon, applyCoupon, removeCoupon } = useCoupon();
  
  // Fix: Convert storeInfo to array if it's an object
  const storeInfoArray = Array.isArray(storeInfo) ? storeInfo : Object.values(storeInfo || {});
  const storeGroupsRecord = useGroupItemsByStore(cartItems, storeInfoArray);
  
  // Calculate totals
  const storeCount = Object.keys(storeGroupsRecord).length;
  const { subtotal, discount, shipping, total, totalPoints } = useCartTotals(
    cartItems, 
    storeCount, 
    appliedCoupon?.discount || 0,
    cart?.summary.totalPoints
  );

  // Memoize the refresh cart function with a ref to avoid recreating it on every render
  const memoizedRefreshCart = useCallback(async () => {
    try {
      setError(null);
      await refreshCart();
    } catch (err: any) {
      console.error("Error refreshing cart:", err);
      setError("Erro ao carregar o carrinho. Por favor, tente novamente.");
    }
  }, [refreshCart]);

  // Load cart only once when component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("CartScreen: User not authenticated, redirecting to login");
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    console.log("CartScreen: Loading initial cart data");
    
    const loadCart = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshCart();
      } catch (err: any) {
        console.error("Error refreshing cart:", err);
        setError("Erro ao carregar o carrinho. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
    
    // Use a ref to prevent creating multiple intervals
    const intervalId = setInterval(() => {
      console.log("CartScreen: Periodic cart refresh");
      memoizedRefreshCart().catch(err => {
        console.error("Error in periodic refresh:", err);
      });
    }, 300000); // Every 5 minutes
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated, navigate, memoizedRefreshCart]); 

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

    // Don't proceed if this item is already being processed
    if (processingItem === item.id) {
      console.log("CartScreen: Item already processing, ignoring request", item.id);
      return;
    }

    try {
      setProcessingItem(item.id);
      console.log("CartScreen: Updating quantity for item:", item.id, "to", newQuantity);
      await updateQuantity(item.id, newQuantity);
      toast.success('Carrinho atualizado com sucesso');
      
      // Only refresh, don't set loading state again to prevent flicker
      setTimeout(() => {
        memoizedRefreshCart().catch(err => {
          console.error("Error refreshing after quantity update:", err);
        });
      }, 300);
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
    
    // Don't proceed if this item is already being processed
    if (processingItem === itemId) {
      console.log("CartScreen: Item already processing, ignoring removal request", itemId);
      return;
    }
    
    try {
      setProcessingItem(itemId);
      console.log("CartScreen: Removing item:", itemId);
      await removeItem(itemId);
      toast.success('Item removido do carrinho');
      
      // Only refresh, don't set loading state again
      setTimeout(() => {
        memoizedRefreshCart().catch(err => {
          console.error("Error refreshing after item removal:", err);
        });
      }, 300);
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
    itemsByStore: storeGroupsRecord,
    processingItem,
    couponCode,
    setCouponCode,
    appliedCoupon,
    subtotal,
    discount,
    shipping,
    total,
    totalPoints,
    refreshCart: memoizedRefreshCart,
    handleUpdateQuantity,
    handleRemoveItem,
    applyCoupon,
    removeCoupon
  };
};
