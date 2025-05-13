
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/use-cart';
import { useCartTotals } from '@/hooks/cart/use-cart-totals';
import { Address, addressService } from '@/services/addressService';
import { orderService } from '@/services/orderService';
import { toast } from '@/components/ui/sonner';

export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'money';

export function useCheckout() {
  const navigate = useNavigate();
  const { cart, cartItems, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processError, setProcessError] = useState<string | null>(null);
  const [changeAmount, setChangeAmount] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [orderAttempts, setOrderAttempts] = useState(0);

  // Calculate totals based on cart items
  const { subtotal, shipping, total, totalPoints } = useCartTotals(
    cartItems,
    cart?.stores?.length || 0
  );

  // Count unique stores for display
  const storeGroups = React.useMemo(() => {
    const stores = new Map();
    cartItems.forEach(item => {
      if (item.produto?.loja_id) {
        if (!stores.has(item.produto.loja_id)) {
          stores.set(item.produto.loja_id, {
            id: item.produto.loja_id,
            items: []
          });
        }
        stores.get(item.produto.loja_id).items.push(item);
      }
    });
    return Array.from(stores.values());
  }, [cartItems]);
  
  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setIsLoading(true);
        const addressList = await addressService.getAddresses();
        console.log("Fetched addresses:", addressList);
        
        setAddresses(addressList);
        
        // Set default address if available
        const primaryAddress = addressList.find(addr => addr.principal);
        if (primaryAddress) {
          setSelectedAddress(primaryAddress);
        } else if (addressList.length > 0) {
          setSelectedAddress(addressList[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast("Erro ao carregar endereços", {
          description: "Por favor, tente novamente ou adicione um novo endereço.",
        });
        setIsLoading(false);
      }
    };
    
    fetchAddresses();
  }, []);

  const handlePlaceOrder = async () => {
    // Validate if we have an address
    if (!selectedAddress) {
      toast("Endereço necessário", {
        description: "Por favor, selecione um endereço de entrega.",
      });
      return;
    }
    
    // Validate change amount if payment method is money
    if (paymentMethod === 'money' && (!changeAmount || parseFloat(changeAmount) < total)) {
      toast("Valor insuficiente", {
        description: "O troco deve ser maior que o valor total do pedido.",
      });
      return;
    }
    
    // Validate cart
    if (!cart || cartItems.length === 0) {
      toast("Carrinho vazio", {
        description: "Seu carrinho está vazio. Adicione produtos antes de finalizar.",
      });
      return;
    }
    
    setIsSubmitting(true);
    setProcessError(null);
    
    try {
      console.log("Creating order with address:", selectedAddress);
      
      const orderData = {
        items: cartItems,
        endereco_entrega: selectedAddress,
        forma_pagamento: paymentMethod,
        valor_total: total,
        pontos_ganhos: totalPoints
      };

      const orderId = await orderService.createOrder(orderData);
      
      if (!orderId) {
        throw new Error("Falha ao gerar o pedido");
      }
      
      // Clear the cart after successful order
      await clearCart();
      
      toast.success("Pedido realizado com sucesso!", {
        description: "Você receberá detalhes por email."
      });

      // Navigate to order confirmation page
      navigate(`/order-confirmation/${orderId}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      
      setProcessError(error.message || "Erro ao processar o pedido. Tente novamente.");
      
      toast.error("Erro ao finalizar pedido", {
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        duration: 5000
      });
      
      setIsSubmitting(false);
      setOrderAttempts(prev => prev + 1);
    }
  };
  
  const selectAddress = (addr: Address) => {
    setSelectedAddress(addr);
    setShowAddressModal(false);
  };
  
  const addNewAddress = () => {
    // Close this modal and navigate to address screen
    setShowAddressModal(false);
    navigate('/profile/addresses');
  };

  // Reset error state on retry
  const handleRetry = () => {
    setProcessError(null);
    setIsSubmitting(false);
  };

  return {
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    isLoading,
    processError,
    changeAmount,
    setChangeAmount,
    showAddressModal,
    setShowAddressModal,
    addresses,
    selectedAddress,
    orderAttempts,
    storeGroups,
    subtotal,
    shipping,
    total,
    totalPoints,
    handlePlaceOrder,
    selectAddress,
    addNewAddress,
    handleRetry
  };
}
