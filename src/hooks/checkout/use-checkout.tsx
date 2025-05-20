
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/use-cart';
import { useAddresses } from '@/hooks/useAddresses';
import { toast } from '@/components/ui/sonner';
import { orderService } from '@/services/orderService';
import { CartItem } from '@/types/cart';
import { Address } from '@/services/addressService';
import { useGroupItemsByStore, storeGroupsToArray, StoreGroup } from '@/hooks/cart/use-group-items-by-store';

// Define the PaymentMethod type
export type PaymentMethod = 'credit' | 'debit' | 'money' | 'pix';

export function useCheckout() {
  const navigate = useNavigate();
  const { cart, cartItems, clearCart, refreshCart } = useCart();
  const { 
    addresses, 
    isLoading: addressesLoading, 
    addAddress 
  } = useAddresses();
  
  // State management
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [changeAmount, setChangeAmount] = useState<string>('0');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [orderAttempts, setOrderAttempts] = useState(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Calculate totals
  const subtotal = cart?.summary?.subtotal || 0;
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;
  
  // Use the product-specific points directly from cart summary
  // and don't calculate based on total amount
  const totalPoints = cart?.summary?.totalPoints || 0;
  
  // Group items by store
  const storeGroupsRecord = useGroupItemsByStore(cartItems, cart?.stores || []);
  // Convert record to array for components that expect an array
  const storeGroupsArray = storeGroupsToArray(storeGroupsRecord);
  
  // Set default address on load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.principal) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [addresses, selectedAddress]);
  
  // Select address handler
  const selectAddress = useCallback((address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  }, []);
  
  // Add new address handler
  const addNewAddress = useCallback(async (formData: Partial<Address>) => {
    try {
      // Use the addAddress function from useAddresses hook
      if (addAddress) {
        await addAddress(formData);
        toast.success('Endereço adicionado com sucesso');
      } else {
        console.error('addAddress function is not available');
        toast.error('Não foi possível adicionar o endereço');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Erro ao adicionar endereço');
    }
  }, [addAddress]);
  
  // Handle order placement
  const handlePlaceOrder = useCallback(async () => {
    try {
      // Check if the device is online
      if (!navigator.onLine) {
        toast.error('Você está offline', {
          description: 'Verifique sua conexão com a internet e tente novamente'
        });
        setProcessError('Dispositivo offline. Verifique sua conexão com a internet e tente novamente.');
        return;
      }
      
      if (!selectedAddress) {
        toast.error('Selecione um endereço de entrega');
        return;
      }
      
      if (!cartItems.length) {
        toast.error('Seu carrinho está vazio');
        return;
      }
      
      setIsSubmitting(true);
      setProcessError(null);
      setOrderAttempts(prev => prev + 1);
      
      // Prepare order data with product-specific points
      const orderData = {
        items: cartItems,
        endereco_entrega: selectedAddress,
        forma_pagamento: paymentMethod,
        valor_total: total,
        pontos_ganhos: totalPoints,
      };
      
      console.log('Sending order with data:', orderData);
      
      // Create order with retry logic
      let maxAttempts = 3;
      let attempt = 1;
      let orderId = null;
      
      while (attempt <= maxAttempts && !orderId) {
        try {
          if (attempt > 1) {
            console.log(`Retry attempt ${attempt} of ${maxAttempts}`);
            // Add increasing delay between retries (1s, 2s, 3s...)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
          
          orderId = await orderService.createOrder(orderData);
          if (orderId) break;
        } catch (err: any) {
          console.error(`Attempt ${attempt} failed:`, err);
          
          // If network error and not last attempt, retry
          const isNetworkError = err.message?.includes('conexão') || 
                                err.message?.includes('network') || 
                                err.message?.includes('Failed to');
                                
          if (attempt === maxAttempts || !isNetworkError) {
            throw err; // If last attempt or not network error, rethrow
          }
        }
        attempt++;
      }
      
      if (orderId) {
        // Success flow
        clearCart();
        refreshCart();
        toast.success('Pedido realizado com sucesso!');
        navigate(`/order/confirmacao/${orderId}`); // Updated path to Portuguese version
      } else {
        throw new Error('Falha ao processar pedido após várias tentativas');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      setProcessError(error.message || 'Erro ao processar seu pedido');
      toast.error('Não foi possível completar seu pedido', {
        description: error.message || 'Por favor, tente novamente'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedAddress, 
    cartItems, 
    paymentMethod, 
    total, 
    totalPoints, 
    clearCart, 
    refreshCart, 
    navigate
  ]);
  
  // Handle retry
  const handleRetry = useCallback(() => {
    // Check connection before retry
    if (!navigator.onLine) {
      toast.error('Você está offline', {
        description: 'Conecte-se à internet para tentar novamente'
      });
      return;
    }
    
    setProcessError(null);
    handlePlaceOrder();
  }, [handlePlaceOrder]);
  
  return {
    // Data
    addresses,
    selectedAddress,
    paymentMethod,
    changeAmount,
    cartItems,
    storeGroups: storeGroupsArray,
    subtotal,
    shipping,
    total,
    totalPoints,
    showAddressModal,
    isSubmitting,
    processError,
    orderAttempts,
    isLoading: addressesLoading,
    isOnline,
    
    // Actions
    setPaymentMethod,
    setChangeAmount,
    setShowAddressModal,
    selectAddress,
    addNewAddress,
    handlePlaceOrder,
    handleRetry
  };
}
