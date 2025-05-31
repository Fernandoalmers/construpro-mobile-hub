import { useEffect, useMemo, useState, useCallback } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useCoupon } from '@/hooks/cart/use-coupon';
import { useNavigate } from 'react-router-dom';
import { useGroupItemsByStore } from '@/hooks/cart/use-group-items-by-store';
import { useCartTotals } from '@/hooks/cart/use-cart-totals';
import { useStoreInfo } from '@/hooks/cart/use-store-info';
import { useAuth } from '@/context/AuthContext';
import { validateCartStock } from '@/services/checkout/stockValidation';
import { toast } from '@/components/ui/sonner';

export const useCartScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Use the unified cart context directly
  const {
    cart,
    cartItems,
    cartCount, // Use the unified cart count from context
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  } = useCart();

  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    isValidating
  } = useCoupon();

  // Extract unique store IDs from cart items
  const storeIds = useMemo(() => {
    const ids = cartItems.map(item => item.produto?.loja_id).filter(Boolean);
    return [...new Set(ids)];
  }, [cartItems]);

  // Fetch store information
  const { storeInfo, loading: storeLoading } = useStoreInfo(storeIds);

  // Group items by store with store info
  const { groupedItems } = useGroupItemsByStore(cartItems);

  // Enhance grouped items with store information
  const enhancedGroupedItems = useMemo(() => {
    const enhanced: Record<string, any> = {};
    
    Object.entries(groupedItems).forEach(([storeId, group]) => {
      const storeData = storeInfo[storeId] || {
        id: storeId,
        nome: `Loja ${storeId.substring(0, 4)}`,
        logo_url: null
      };
      
      enhanced[storeId] = {
        ...group,
        loja: storeData
      };
    });
    
    return enhanced;
  }, [groupedItems, storeInfo]);

  // Calculate totals - garantir que o desconto do cupom seja considerado
  const { subtotal, shipping, discount, total, totalPoints } = useCartTotals(
    cartItems,
    Object.keys(enhancedGroupedItems).length,
    appliedCoupon?.discount || 0, // Passar o desconto do cupom aplicado
    0,
    (user as any)?.tipo_perfil || 'consumidor'
  );

  // Derived states
  const cartIsEmpty = cartItems.length === 0;

  // Atualizar carrinho quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshCart();
    }
  }, [isAuthenticated, user?.id, refreshCart]);

  // Save applied coupon to localStorage when applied
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  const handleApplyCoupon = async (code: string) => {
    if (!user?.id) {
      console.error('[useCartScreen] No user ID available for coupon application');
      return;
    }

    // Calcular valor total do carrinho
    const orderValue = cartItems.reduce((total, item) => {
      const price = item.produto?.preco_promocional || item.produto?.preco_normal || item.preco || 0;
      const quantity = item.quantidade || 1;
      return total + (price * quantity);
    }, 0);

    console.log('[useCartScreen] Aplicando cupom com dados do carrinho:', {
      code,
      orderValue,
      userId: user.id,
      cartItems: cartItems.map(item => ({
        id: item.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco: item.produto?.preco_promocional || item.produto?.preco_normal || item.preco
      }))
    });

    await applyCoupon(code, orderValue, user.id, cartItems);
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      console.log('[useCartScreen] Updating quantity:', cartItemId, newQuantity);
      
      if (newQuantity <= 0) {
        await removeItem(cartItemId);
      } else {
        await updateQuantity(cartItemId, newQuantity);
      }
      
      // Se houver cupom aplicado, remover pois os valores mudaram
      if (appliedCoupon) {
        removeCoupon();
      }
    } catch (error) {
      console.error('[useCartScreen] Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      console.log('[useCartScreen] Removing item:', cartItemId);
      await removeItem(cartItemId);
      
      // Se houver cupom aplicado, remover pois os itens mudaram
      if (appliedCoupon) {
        removeCoupon();
      }
    } catch (error) {
      console.error('[useCartScreen] Error removing item:', error);
    }
  };

  const handleClearCart = async () => {
    try {
      console.log('[useCartScreen] Clearing cart');
      await clearCart();
      
      // Remover cupom se houver
      if (appliedCoupon) {
        removeCoupon();
      }
    } catch (error) {
      console.error('[useCartScreen] Error clearing cart:', error);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    
    console.log('[useCartScreen] Proceeding to checkout with:', {
      cartItems: cartItems.length,
      appliedCoupon,
      total: total
    });
    
    navigate('/checkout');
  };

  // New state for stock validation
  const [stockIssues, setStockIssues] = useState<{
    outOfStock: string[];
    lowStock: { itemId: string; available: number }[];
  }>({ outOfStock: [], lowStock: [] });
  
  // Periodic stock validation
  const validateCurrentStock = useCallback(async () => {
    if (cartItems.length === 0) return;
    
    try {
      const result = await validateCartStock(cartItems);
      
      if (!result.isValid) {
        const outOfStock = result.invalidItems.map(item => item.itemId);
        const lowStock = result.adjustedItems.map(item => ({
          itemId: item.itemId,
          available: item.newQuantity
        }));
        
        setStockIssues({ outOfStock, lowStock });
        
        // Auto-remove out of stock items
        if (outOfStock.length > 0) {
          toast.warning(`${outOfStock.length} produto(s) ficaram indisponíveis e foram removidos do carrinho`);
          for (const itemId of outOfStock) {
            await removeItem(itemId);
          }
        }
        
        // Notify about low stock items
        if (lowStock.length > 0) {
          toast.warning(`Alguns produtos têm estoque limitado`);
        }
      } else {
        setStockIssues({ outOfStock: [], lowStock: [] });
      }
    } catch (error) {
      console.error('Error validating cart stock:', error);
    }
  }, [cartItems, removeItem]);
  
  // Validate stock periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(validateCurrentStock, 30000);
    return () => clearInterval(interval);
  }, [validateCurrentStock]);
  
  return {
    // States
    loading: isLoading || storeLoading,
    error: null,
    cartIsEmpty,
    
    // Cart data
    cart,
    cartItems,
    cartCount, // Use the unified calculation from context
    itemsByStore: enhancedGroupedItems,
    processingItem: null,
    
    // Coupon data
    appliedCoupon,
    couponCode,
    setCouponCode,
    isValidating,
    
    // Totals
    subtotal,
    discount,
    shipping,
    total,
    totalPoints,
    
    // Actions
    refreshCart,
    handleUpdateQuantity,
    handleRemoveItem,
    clearCart: handleClearCart,
    applyCoupon: handleApplyCoupon,
    removeCoupon,
    handleCheckout,
    
    // User info
    user,
    isAuthenticated,
    
    // Add stock validation data
    stockIssues
  };
};
