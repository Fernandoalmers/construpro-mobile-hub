
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Cart, cartService } from '@/services/cartService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError('Falha ao carregar o carrinho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.addToCart(productId, quantity);
      setCart(updatedCart);
      toast.success('Produto adicionado ao carrinho');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error('Erro ao adicionar ao carrinho');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.updateCartItemQuantity(itemId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to update quantity:', err);
      toast.error('Erro ao atualizar quantidade');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setLoading(true);
      const updatedCart = await cartService.removeFromCart(itemId);
      setCart(updatedCart);
      toast.success('Item removido do carrinho');
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast.error('Erro ao remover item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      setCart(null);
      toast.success('Carrinho esvaziado');
    } catch (err) {
      console.error('Failed to clear cart:', err);
      toast.error('Erro ao limpar carrinho');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calculate total items in cart
  const cartCount = cart?.items?.length || 0;

  const value = {
    cart,
    cartCount,
    loading,
    error,
    refreshCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
