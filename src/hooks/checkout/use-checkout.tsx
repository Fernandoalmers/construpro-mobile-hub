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
  
  // Calculate totals
  const subtotal = cart?.summary?.subtotal || 0;
  const shipping = cart?.summary?.shipping || 15.90;
  const total = subtotal + shipping;
  const totalPoints = cart?.summary?.totalPoints || Math.floor(total * 0.1);
  
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
      
      // Prepare order data
      const orderData = {
        items: cartItems,
        endereco_entrega: selectedAddress,
        forma_pagamento: paymentMethod,
        valor_total: total,
        pontos_ganhos: totalPoints,
        status: "Confirmado" // Use capital C to match constraint
      };
      
      // Create order
      const orderId = await orderService.createOrder(orderData);
      
      if (orderId) {
        // Success flow
        clearCart();
        refreshCart();
        toast.success('Pedido realizado com sucesso!');
        navigate(`/marketplace/order-confirmation/${orderId}`);
      } else {
        throw new Error('Falha ao processar pedido');
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
    setProcessError(null);
    handlePlaceOrder();
  }, [handlePlaceOrder]);
  
  return {
    // Data
    addresses,
    selectedAddress,
    paymentMethod,
    changeAmount,
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
