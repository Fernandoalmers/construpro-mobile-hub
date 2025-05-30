
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
import { referralService } from '@/services/pointsService';

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
  
  // Function to activate referral on first purchase
  const activateReferralOnFirstPurchase = useCallback(async (userId: string) => {
    try {
      console.log('🎁 [useCheckout] Checking for pending referrals to activate');
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.warn('🎁 [useCheckout] No session found for referral activation');
        return;
      }

      const response = await fetch('https://orqnibkshlapwhjjmszh.supabase.co/functions/v1/referral-processing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({
          action: 'activate_referral_on_first_purchase',
          user_id: userId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [useCheckout] Referral activation result:', result);
        
        if (result.message.includes('activated')) {
          toast.success('🎉 Parabéns! Você e seu amigo ganharam 50 pontos cada pela indicação!');
        }
      } else {
        console.warn('⚠️ [useCheckout] Referral activation request failed:', response.status);
      }
    } catch (error) {
      console.error('❌ [useCheckout] Error activating referral:', error);
      // Don't show error to user as this is a bonus feature
    }
  }, []);
  
  // Verify authentication before checkout operations
  const verifyAuthentication = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast.error('Você precisa estar logado para finalizar a compra');
      navigate('/login');
      return false;
    }
    
    // Enhanced session verification
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.error('Session verification failed:', error);
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        navigate('/login');
        return false;
      }
      
      // Verify user matches session
      if (session.user?.id !== user.id) {
        console.error('User ID mismatch between context and session');
        toast.error('Sessão inconsistente. Por favor, faça login novamente.');
        navigate('/login');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Authentication verification error:', error);
      toast.error('Erro na verificação de autenticação');
      return false;
    }
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
  
  // Handle order placement with enhanced error handling and debugging
  const handlePlaceOrder = useCallback(async () => {
    try {
      console.log('🛒 [handlePlaceOrder] Starting order placement process');
      console.log('🛒 [handlePlaceOrder] User context:', { 
        isAuthenticated, 
        userId: user?.id, 
        userEmail: user?.email 
      });
      
      // First verify authentication
      const isAuthValid = await verifyAuthentication();
      if (!isAuthValid) {
        console.error('🛒 [handlePlaceOrder] Authentication verification failed');
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

      console.log('🛒 [handlePlaceOrder] Cart items:', cartItems.length);
      console.log('🛒 [handlePlaceOrder] Selected address:', selectedAddress);

      // Enhanced address validation with better error messages
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
        console.error('🛒 [handlePlaceOrder] Address validation failed:', {
          selectedAddress,
          addressValidation,
          missingFields: {
            rua: !addressValidation.rua,
            cidade: !addressValidation.cidade,
            estado: !addressValidation.estado,
            cep: !addressValidation.cep
          }
        });
        toast.error('Endereço incompleto. Verifique se todos os campos obrigatórios estão preenchidos.');
        return;
      }

      console.log('✅ [handlePlaceOrder] Address validation passed:', addressValidation);

      setIsSubmitting(true);
      setProcessError(null);
      setOrderAttempts(prev => prev + 1);
      
      // Final stock validation before creating order
      console.log('🛒 [handlePlaceOrder] Performing final stock validation');
      const stockValid = await validateStock();
      if (!stockValid) {
        setIsSubmitting(false);
        return;
      }
      
      // Prepare order data with proper validation and structure
      const orderData = {
        items: cartItems,
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
      
      console.log('🚀 [handlePlaceOrder] Sending order with validated data:', {
        itemsCount: orderData.items.length,
        endereco_entrega: orderData.endereco_entrega,
        valor_total: orderData.valor_total,
        pontos_ganhos: orderData.pontos_ganhos,
        userId: user?.id
      });
      
      // Create order
      const orderId = await orderService.createOrder(orderData);
      
      if (orderId) {
        console.log('✅ [handlePlaceOrder] Order created successfully:', orderId);
        
        // Activate referral on first purchase (async, don't await)
        if (user?.id) {
          activateReferralOnFirstPurchase(user.id);
        }
        
        // Success flow - clear coupon from localStorage
        localStorage.removeItem('appliedCoupon');
        clearCart();
        refreshCart();
        toast.success('Pedido realizado com sucesso!');
        navigate(`/order/confirmacao/${orderId}`);
      } else {
        throw new Error('Falha ao processar pedido - ID não retornado');
      }
    } catch (error: any) {
      console.error('❌ [handlePlaceOrder] Error placing order:', error);
      
      // Enhanced error handling with more specific messages
      let errorMessage = 'Erro ao processar seu pedido';
      
      if (error.message?.includes('Sessão expirada') || error.message?.includes('autenticação')) {
        errorMessage = 'Sessão expirada. Redirecionando para login...';
        setProcessError(errorMessage);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      if (error.message?.includes('address') || error.message?.includes('endereço')) {
        errorMessage = 'Erro no endereço de entrega. Verifique os dados.';
      } else if (error.message?.includes('stock') || error.message?.includes('estoque')) {
        errorMessage = 'Produto fora de estoque. Atualize seu carrinho.';
      } else if (error.message?.includes('payment') || error.message?.includes('pagamento')) {
        errorMessage = 'Erro no processamento do pagamento.';
      }
      
      setProcessError(error.message || errorMessage);
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
    navigate,
    user,
    isAuthenticated,
    activateReferralOnFirstPurchase
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
