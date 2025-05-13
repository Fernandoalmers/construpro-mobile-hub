
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import Card from '../common/Card';
import { ArrowLeft, CreditCard, Landmark, QrCode, MapPin, CheckCircle, DollarSign, Plus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/sonner";
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/use-cart';
import { useCartTotals } from '@/hooks/cart/use-cart-totals';
import { Address, addressService } from '@/services/addressService';
import { orderService } from '@/services/orderService';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

type PaymentMethod = 'credit' | 'debit' | 'pix' | 'money';

const CheckoutScreen: React.FC = () => {
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
      
      toast("Pedido realizado com sucesso!", {
        description: "Você receberá detalhes por email."
      });

      // Navigate to order confirmation page
      navigate(`/order-confirmation/${orderId}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      
      setProcessError(error.message || "Erro ao processar o pedido. Tente novamente.");
      
      toast("Erro ao finalizar pedido", {
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        style: { backgroundColor: "#f44336", color: "white" }
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

  if (isLoading) {
    return <LoadingState text="Carregando informações..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Finalizar Compra</h1>
      </div>
      
      {/* Show error state if there's a processing error */}
      {processError && (
        <div className="p-4">
          <ErrorState 
            title="Erro ao processar pedido" 
            message={processError}
            errorDetails={`Tentativas: ${orderAttempts}. Último erro: ${processError}`}
            onRetry={handleRetry}
            retryText="Tentar novamente"
          />
        </div>
      )}
      
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Delivery Address */}
          <div>
            <h2 className="font-bold flex items-center mb-3">
              <MapPin size={18} className="mr-2" />
              Endereço de Entrega
            </h2>
            <Card className="p-4">
              {selectedAddress ? (
                <>
                  <p className="font-medium">{selectedAddress.logradouro}, {selectedAddress.numero}</p>
                  {selectedAddress.complemento && (
                    <p className="text-gray-600">{selectedAddress.complemento}</p>
                  )}
                  <p className="text-gray-600">
                    {selectedAddress.bairro}, {selectedAddress.cidade} - {selectedAddress.estado}
                  </p>
                  <p className="text-gray-600">
                    {selectedAddress.cep}
                  </p>
                </>
              ) : (
                <p className="text-gray-600">Nenhum endereço selecionado</p>
              )}
              <div className="mt-3 flex justify-end">
                <CustomButton 
                  variant="link" 
                  className="text-sm p-0"
                  onClick={() => setShowAddressModal(true)}
                >
                  {selectedAddress ? "Alterar endereço" : "Adicionar endereço"}
                </CustomButton>
              </div>
            </Card>
          </div>
          
          {/* Payment Method */}
          <div>
            <h2 className="font-bold mb-3">Forma de Pagamento</h2>
            <Card className="p-4">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="money" id="money" />
                  <Label htmlFor="money" className="flex items-center flex-1">
                    <DollarSign size={18} className="mr-2 text-green-600" />
                    Dinheiro
                  </Label>
                </div>
              
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="flex items-center flex-1">
                    <CreditCard size={18} className="mr-2 text-construPro-blue" />
                    Cartão de Crédito à vista
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="debit" id="debit" />
                  <Label htmlFor="debit" className="flex items-center flex-1">
                    <CreditCard size={18} className="mr-2 text-construPro-blue" />
                    Cartão de Débito
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center flex-1">
                    <QrCode size={18} className="mr-2 text-construPro-blue" />
                    Pix
                  </Label>
                </div>
              </RadioGroup>
              
              {/* Money change field */}
              {paymentMethod === 'money' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label htmlFor="changeAmount" className="block text-sm font-medium mb-2">
                    Troco para quanto?
                  </label>
                  <Input
                    id="changeAmount"
                    type="number"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    placeholder="R$ 0,00"
                    className="max-w-xs"
                  />
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Pagamento será realizado diretamente ao vendedor no momento da entrega.
                </p>
              </div>
            </Card>
          </div>
          
          {/* Order Summary */}
          <div>
            <h2 className="font-bold mb-3">Resumo do Pedido</h2>
            <Card className="p-4">
              <div className="space-y-3 mb-4">
                {/* Per store summary */}
                {storeGroups.map((store, index) => (
                  <div key={store.id} className="border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-center mb-2">
                      <span className="font-medium text-sm">Loja {index + 1}</span>
                    </div>
                    <div className="pl-7 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal ({store.items.length} {store.items.length === 1 ? 'item' : 'itens'})</span>
                        <span>R$ {store.items.reduce((sum, item) => sum + (item.subtotal || 0), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frete</span>
                        <span>Grátis</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span>Grátis</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-construPro-orange text-sm">
                  <span>Pontos a ganhar</span>
                  <span>{totalPoints} pontos</span>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-md flex items-start gap-2 mb-4">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">Seu pedido está qualificado para pontos!</p>
                  <p className="text-sm text-green-600">
                    Você ganhará {totalPoints} pontos quando o pedido for entregue.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <CustomButton 
                  variant="primary" 
                  fullWidth
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processando..." : "Finalizar Pedido"}
                </CustomButton>
                
                <CustomButton 
                  variant="outline" 
                  fullWidth
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Voltar
                </CustomButton>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Address Selection Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolha um endereço</DialogTitle>
          </DialogHeader>
          
          <div className="py-2 space-y-3">
            {addresses.length > 0 ? (
              addresses.map((addr) => (
                <div 
                  key={addr.id}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${addr.principal ? 'border-construPro-blue bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => selectAddress(addr)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{addr.logradouro}, {addr.numero}</p>
                      {addr.complemento && (
                        <p className="text-sm text-gray-600">{addr.complemento}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {addr.bairro}, {addr.cidade} - {addr.estado}
                      </p>
                      <p className="text-sm text-gray-600">{addr.cep}</p>
                    </div>
                    {addr.principal && (
                      <span className="text-xs bg-construPro-blue text-white px-2 py-1 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Nenhum endereço cadastrado</p>
            )}
            
            <Button variant="outline" className="w-full mt-2 flex items-center justify-center" onClick={addNewAddress}>
              <Plus size={16} className="mr-1" />
              Adicionar novo endereço
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressModal(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckoutScreen;
