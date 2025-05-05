
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from './use-cart';
import { fetchProductInfo } from '@/services/cart/productInfo';

export function useCartActions() {
  const { addToCart, refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});
  const [isBuyingNow, setIsBuyingNow] = useState<Record<string, boolean>>({});

  // Add to cart function - properly handles authentication and updates state
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!productId) {
      console.error('[useCartActions] Invalid product ID:', productId);
      toast.error('Erro: ID do produto inválido');
      return false;
    }

    console.log('[useCartActions] handleAddToCart called with:', { productId, quantity });
    
    // Check authentication first before setting loading state
    if (!isAuthenticated || !user) {
      console.log('[useCartActions] User not authenticated, redirecting to login');
      // Store the current product path for redirect after login
      navigate('/login', { state: { from: `/produto/${productId}` } });
      return false;
    }

    // Set loading state at the beginning
    setIsAddingToCart(prev => ({ ...prev, [productId]: true }));
    
    try {
      // Verify the product exists and has inventory
      const productInfo = await fetchProductInfo(productId);
      
      if (!productInfo) {
        console.error('[useCartActions] Product info not found');
        toast.error('Produto não encontrado');
        return false;
      }
      
      if (productInfo.estoque < quantity) {
        console.error('[useCartActions] Not enough inventory:', { available: productInfo.estoque, requested: quantity });
        toast.error(`Apenas ${productInfo.estoque} unidades disponíveis`);
        return false;
      }
      
      console.log('[useCartActions] Product verified, calling addToCart with:', { productId, quantity });
      await addToCart(productId, quantity);
      
      // Refresh cart to make sure the UI updates
      console.log('[useCartActions] Product added to cart, refreshing cart data');
      await refreshCart();
      
      toast.success(`${quantity} unidade(s) adicionada(s) ao carrinho`);
      return true;
    } catch (error: any) {
      console.error('[useCartActions] Error adding to cart:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      return false;
    } finally {
      // Important: Always reset loading state, even on error
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Buy now function - adds to cart then immediately navigates to cart
  const handleBuyNow = async (productId: string, quantity: number = 1) => {
    if (!productId) {
      console.error('[useCartActions] Invalid product ID:', productId);
      toast.error('Erro: ID do produto inválido');
      return;
    }

    console.log('[useCartActions] handleBuyNow called with:', { productId, quantity });
    
    // Check authentication first before setting loading state
    if (!isAuthenticated || !user) {
      console.log('[useCartActions] User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${productId}` } });
      return;
    }

    // Set loading state at the beginning
    setIsBuyingNow(prev => ({ ...prev, [productId]: true }));
    
    try {
      // Use the handleAddToCart function to add the product to cart
      const success = await handleAddToCart(productId, quantity);
      
      if (success) {
        console.log('[useCartActions] Successfully added to cart, navigating to /cart');
        // Navigate to cart page
        navigate('/cart');
      } else {
        console.log('[useCartActions] Failed to add to cart, not navigating');
      }
    } catch (error: any) {
      console.error('[useCartActions] Error buying now:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao processar compra'));
    } finally {
      // Important: Always reset loading state, even on error
      setIsBuyingNow(prev => ({ ...prev, [productId]: false }));
    }
  };

  return {
    handleAddToCart,
    handleBuyNow,
    isAddingToCart,
    isBuyingNow
  };
}
