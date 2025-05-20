
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useAddresses } from '@/hooks/useAddresses';
import { orderService } from '@/services/orderService';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { PaymentMethod } from './types';
import { CartItem } from '@/types/cart';

export type { PaymentMethod };

export function useCheckout() {
  const { cart, clearCart, cartItems, isLoading: cartLoading } = useCart();
  const { addresses, getPrimaryAddress } = useAddresses();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [changeAmount, setChangeAmount] = useState<string>('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processError, setProcessError] = useState<string | null>(null);
  const [orderAttempts, setOrderAttempts] = useState(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const navigate = useNavigate();
  
  // Initialize with primary address if available
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const primary = getPrimaryAddress();
      if (primary) {
        setSelectedAddress(primary);
      }
    }
  }, [addresses, selectedAddress, getPrimaryAddress]);

  // Select address function
  const selectAddress = useCallback((address: any) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  }, []);

  // Get cartItems with products from cart context
  const cartItemsWithProducts: CartItem[] = cartItems || [];
  
  // Group cart items by store
  const storeGroups = cartItemsWithProducts.reduce((groups: any, item: any) => {
    const storeId = item.produto?.loja_id || 'unknown';
    if (!groups[storeId]) {
      groups[storeId] = {
        storeId,
        storeName: item.produto?.loja_nome || 'Loja',
        items: []
      };
    }
    groups[storeId].items.push(item);
    return groups;
  }, {});

  // Calculate total price and points
  const totalPrice = cartItemsWithProducts.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalPoints = cartItemsWithProducts.reduce((sum, item) => sum + ((item.produto?.pontos || 0) * item.quantidade), 0);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restabelecida!');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Você está offline', {
        description: 'É necessário estar online para finalizar seu pedido'
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate subtotal and shipping
  const subtotal = totalPrice;
  const shipping = 15.90; // Fixed shipping price for now
  const total = subtotal + shipping;

  // Initialize loading state
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  const handleRetry = useCallback(() => {
    setProcessError(null);
    toast.info('Tentando novamente...');
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    // Validation checks
    if (!isOnline) {
      toast.error("Você está offline", {
        description: "Conecte-se à internet para finalizar o pedido"
      });
      return;
    }
    
    if (!selectedAddress) {
      toast.error("Selecione um endereço de entrega");
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }
    
    setIsSubmitting(true);
    setOrderAttempts(prev => prev + 1);
    setProcessError(null);
    
    try {
      console.log("Preparando para criar pedido com:", {
        items: cartItemsWithProducts,
        endereco: selectedAddress,
        pagamento: paymentMethod,
        total: total
      });
      
      // Create order
      const orderId = await orderService.createOrder({
        items: cartItemsWithProducts,
        endereco_entrega: selectedAddress,
        forma_pagamento: paymentMethod,
        valor_total: total,
        pontos_ganhos: totalPoints
      });
      
      if (!orderId) {
        throw new Error("Não foi possível completar seu pedido");
      }
      
      // Order created successfully
      console.log("Pedido criado com sucesso:", orderId);
      
      // Clear cart and navigate to confirmation page
      clearCart();
      toast.success("Pedido realizado com sucesso!", {
        description: `Pedido #${orderId.substring(0, 8)} criado`
      });
      
      // Navigate to order confirmation page
      navigate(`/profile/orders/${orderId}`);
      
    } catch (error: any) {
      console.error("Erro ao processar pedido:", error);
      
      // Set error message for display
      setProcessError(error.message || "Não foi possível completar seu pedido");
      
      // Show toast with retry option
      toast.error("Erro ao finalizar pedido", {
        description: error.message || "Por favor, tente novamente em alguns instantes",
        action: {
          label: 'Tentar novamente',
          onClick: handleRetry,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cartItemsWithProducts, 
    selectedAddress, 
    paymentMethod, 
    total, 
    totalPoints, 
    clearCart, 
    navigate,
    handleRetry,
    cartItems.length,
    isOnline
  ]);

  return {
    cart,
    cartItems: cartItemsWithProducts,
    addresses,
    selectedAddress,
    selectAddress,
    paymentMethod,
    setPaymentMethod,
    changeAmount,
    setChangeAmount,
    showAddressModal,
    setShowAddressModal,
    isSubmitting,
    isLoading: isLoading || cartLoading,
    subtotal,
    shipping,
    total,
    totalPoints,
    storeGroups: Object.values(storeGroups),
    handlePlaceOrder,
    processError,
    orderAttempts,
    handleRetry,
    isOnline
  };
}
