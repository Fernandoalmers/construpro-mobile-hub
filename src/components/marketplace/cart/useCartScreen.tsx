
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    console.log("CartScreen: Refreshing cart data");
    // Explicitly refresh the cart when the component mounts
    const loadCart = async () => {
      try {
        setLoading(true);
        await refreshCart();
      } catch (err) {
        console.error("Error refreshing cart:", err);
        setError("Erro ao carregar o carrinho. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    
    loadCart();
  }, [isAuthenticated, navigate, refreshCart]);

  // Add debugging logs
  useEffect(() => {
    console.log("CartScreen: Cart data updated:", cart);
    console.log("CartScreen: Cart items:", cart?.items?.length || 0);
  }, [cart]);

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    if (newQuantity > (item.produto?.estoque || 0)) {
      toast.error('Quantidade solicitada não disponível em estoque');
      return;
    }

    try {
      setProcessingItem(item.id);
      await updateQuantity(item.id, newQuantity);
      toast.success('Carrinho atualizado com sucesso');
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
      await removeItem(itemId);
      toast.success('Item removido do carrinho');
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
  
  const itemsByStore = cartItems.reduce((groups: Record<string, { loja: any, items: CartItem[] }>, item) => {
    const storeId = item.produto?.loja_id;
    if (!storeId) return groups;
    
    if (!groups[storeId]) {
      const store = cart?.stores?.find(s => s.id === storeId);
      groups[storeId] = {
        loja: store || { id: storeId, nome: 'Loja' },
        items: []
      };
    }
    
    groups[storeId].items.push(item);
    return groups;
  }, {});

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
