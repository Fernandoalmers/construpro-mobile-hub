
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/use-cart';
import { useAddresses } from '@/hooks/useAddresses';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
import { orderService } from '@/services/orderService';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types/cart';
import { Address } from '@/services/addressService';
import { useGroupItemsByStore, storeGroupsToArray, StoreGroup } from '@/hooks/cart/use-group-items-by-store';
import { validateCartStock, StockValidationResult } from '@/services/checkout/stockValidation';

// Define the PaymentMethod type
export type PaymentMethod = 'credit' | 'debit' | 'money' | 'pix';

export function useCheckout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, cartItems, clearCart, refreshCart, updateQuantity, removeItem } = useCart();
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
  
  // New state for stock validation
  const [stockValidationResult, setStockValidationResult] = useState<StockValidationResult | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  
  // Get cart summary data including coupon discount
  const cartSummary = cart?.summary || {
    subtotal: 0,
    shipping: 0,
    totalItems: 0,
    totalPoints: 0
  };
  
  // Calculate totals - use cart summary data directly
  const subtotal = cartSummary.subtotal || 0;
  const shipping = 0; // Free shipping
  
  // Get applied coupon information from localStorage or cart context
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  
  // Check for applied coupon from localStorage on mount
  useEffect(() => {
    const storedCoupon = localStorage.getItem('appliedCoupon');
    if (storedCoupon) {
      try {
        const couponData = JSON.parse(storedCoupon);
        setAppliedCoupon(couponData);
      } catch (error) {
        console.error('Error parsing stored coupon:', error);
      }
    }
  }, []);
  
  // Calculate discount and total
  const discount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal - discount + shipping);
  
  // Use the product-specific points directly from cart summary
  const totalPoints = cartSummary.totalPoints || 0;
  
  // Group items by store
  const { groupedItems } = useGroupItemsByStore(cartItems);
  // Convert record to array for components that expect an array
  const storeGroupsArray = storeGroupsToArray(groupedItems);
  
  // Verify authentication before checkout operations
  const verifyAuthentication = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast.error('Você precisa estar logado para finalizar a compra');
      navigate('/login');
      return false;
    }
    
    // Check if session is still valid
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.error('Session verification failed:', error);
      toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      navigate('/login');
      return false;
    }
    
    return true;
  }, [isAuthenticated, user, navigate]);
  
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
  
  // Validate stock when entering checkout
  const validateStock = useCallback(async () => {
    if (!cartItems.length) return true;
    
    setIsValidatingStock(true);
    try {
      const result = await validateCartStock(cartItems);
      
      if (!result.isValid) {
        setStockValidationResult(result);
        setShowStockModal(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating stock:', error);
      toast.error('Erro ao validar estoque dos produtos');
      return false;
    } finally {
      setIsValidatingStock(false);
    }
  }, [cartItems]);
  
  // Handle stock validation results
  const handleRemoveInvalidItems = useCallback(async (itemIds: string[]) => {
    for (const itemId of itemIds) {
      await removeItem(itemId);
    }
    toast.success('Produtos indisponíveis foram removidos do carrinho');
  }, [removeItem]);
  
  const handleAdjustItemQuantities = useCallback(async (adjustments: { itemId: string; newQuantity: number }[]) => {
    for (const adjustment of adjustments) {
      await updateQuantity(adjustment.itemId, adjustment.newQuantity);
    }
    toast.success('Quantidades foram ajustadas conforme o estoque disponível');
  }, [updateQuantity]);
  
  const handleStockModalContinue = useCallback(() => {
    setShowStockModal(false);
    setStockValidationResult(null);
    refreshCart();
  }, [refreshCart]);
  
  // Handle order placement with improved data validation
  const handlePlaceOrder = useCallback(async () => {
    try {
      // First verify authentication
      const isAuthValid = await verifyAuthentication();
      if (!isAuthValid) {
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

      // Validate address has required fields using correct Portuguese field names
      const addressValidation = {
        rua: selectedAddress.logradouro || '',
        numero: selectedAddress.numero || '',
        complemento: selectedAddress.complemento || '',
        bairro: selectedAddress.bairro || '',
        cidade: selectedAddress.cidade || '',
        estado: selectedAddress.estado || '',
        cep: selectedAddress.cep || '',
        ponto_referencia: '' // This field doesn't exist in our Address interface
      };

      // Check required address fields
      if (!addressValidation.rua || !addressValidation.cidade || !addressValidation.estado || !addressValidation.cep) {
        toast.error('Endereço incompleto. Verifique se todos os campos obrigatórios estão preenchidos.');
        return;
      }

      setIsSubmitting(true);
      setProcessError(null);
      setOrderAttempts(prev => prev + 1);
      
      // Final stock validation before creating order
      console.log('Performing final stock validation before order creation');
      const stockValid = await validateStock();
      if (!stockValid) {
        setIsSubmitting(false);
        return;
      }
      
      // Prepare order data with proper validation and structure
      const orderData = {
        items: cartItems, // Use cartItems directly as they already match CartItem interface
        endereco_entrega: addressValidation,
        forma_pagamento: paymentMethod,
        valor_total: Number(total),
        pontos_ganhos: Number(totalPoints),
        cupom_aplicado: appliedCoupon ? {
          code: appliedCoupon.code,
          discount: Number(appliedCoupon.discount)
        } : null,
        desconto: Number(discount)
      };
      
      console.log('Sending order with validated data:', orderData);
      
      // Create order
      const orderId = await orderService.createOrder(orderData);
      
      if (orderId) {
        // Success flow - clear coupon from localStorage
        localStorage.removeItem('appliedCoupon');
        clearCart();
        refreshCart();
        toast.success('Pedido realizado com sucesso!');
        navigate(`/order/confirmacao/${orderId}`);
      } else {
        throw new Error('Falha ao processar pedido');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      
      // Handle authentication-specific errors
      if (error.message?.includes('Sessão expirada') || error.message?.includes('autenticação')) {
        setProcessError('Sessão expirada. Redirecionando para login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      setProcessError(error.message || 'Erro ao processar seu pedido');
      toast.error('Não foi possível completar seu pedido', {
        description: error.message || 'Por favor, tente novamente'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    verifyAuthentication,
    selectedAddress, 
    cartItems, 
    paymentMethod, 
    total, 
    totalPoints,
    appliedCoupon,
    discount,
    validateStock,
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
    cartItems,
    storeGroups: storeGroupsArray,
    subtotal,
    shipping,
    discount,
    total,
    totalPoints,
    appliedCoupon,
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
    handleRetry,
    
    // New stock validation values
    stockValidationResult,
    showStockModal,
    isValidatingStock,
    validateStock,
    setShowStockModal,
    handleRemoveInvalidItems,
    handleAdjustItemQuantities,
    handleStockModalContinue
  };
}
