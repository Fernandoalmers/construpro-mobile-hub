
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import Card from '../common/Card';
import { ArrowLeft, CreditCard, Landmark, QrCode, MapPin, CheckCircle, DollarSign, Plus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";

type PaymentMethod = 'credit' | 'debit' | 'pix' | 'money';

const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Mock data - in real app this would come from user profile or previous input
  const [address, setAddress] = useState({
    street: 'Av. Paulista, 1000',
    complement: 'Apto 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100'
  });
  
  // Mock saved addresses
  const savedAddresses = [
    {
      id: '1',
      street: 'Av. Paulista, 1000',
      complement: 'Apto 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      default: true
    },
    {
      id: '2',
      street: 'Rua Augusta, 500',
      complement: 'Casa',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000',
      default: false
    }
  ];

  const handlePlaceOrder = () => {
    // Validate change amount if payment method is money
    if (paymentMethod === 'money' && (!changeAmount || parseFloat(changeAmount) < 100)) {
      toast({
        title: "Valor insuficiente",
        description: "O troco deve ser maior que o valor total do pedido.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você receberá detalhes por email.",
        action: (
          <button 
            onClick={() => navigate('/home')}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Ver detalhes
          </button>
        ),
      });
      navigate('/pedidos');
    }, 1500);
  };
  
  const selectAddress = (addr: typeof savedAddresses[0]) => {
    setAddress({
      street: addr.street,
      complement: addr.complement,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode
    });
    setShowAddressModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Finalizar Compra</h1>
      </div>
      
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Delivery Address */}
          <div>
            <h2 className="font-bold flex items-center mb-3">
              <MapPin size={18} className="mr-2" />
              Endereço de Entrega
            </h2>
            <Card className="p-4">
              <p className="font-medium">{address.street}</p>
              <p className="text-gray-600">{address.complement}</p>
              <p className="text-gray-600">
                {address.city}, {address.state} - {address.zipCode}
              </p>
              <div className="mt-3 flex justify-end">
                <CustomButton 
                  variant="link" 
                  className="text-sm p-0"
                  onClick={() => setShowAddressModal(true)}
                >
                  Alterar endereço
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
              
              {paymentMethod === 'credit' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-3">Pagamento à vista no cartão</p>
                  {/* Credit card form would go here in a real app */}
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    Formulário de cartão simplificado para demo
                  </div>
                </div>
              )}
              
              {paymentMethod === 'debit' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-3">Cartão de débito</p>
                  {/* Debit card form would go here in a real app */}
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    Formulário de cartão simplificado para demo
                  </div>
                </div>
              )}
              
              {paymentMethod === 'pix' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    O QR Code do Pix será exibido após a confirmação do pedido.
                  </p>
                </div>
              )}
            </Card>
          </div>
          
          {/* Order Summary */}
          <div>
            <h2 className="font-bold mb-3">Resumo do Pedido</h2>
            <Card className="p-4">
              <div className="space-y-3 mb-4">
                {/* Per store summary */}
                <div className="border-b border-gray-100 pb-3 mb-3">
                  <div className="flex items-center mb-2">
                    <img 
                      src="https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=150&h=150&fit=crop&q=80" 
                      alt="Casa do Construtor" 
                      className="w-5 h-5 rounded-full object-cover mr-2"
                    />
                    <span className="font-medium text-sm">Casa do Construtor</span>
                  </div>
                  <div className="pl-7 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal (2 itens)</span>
                      <span>R$ 299,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frete</span>
                      <span>R$ 15,90</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-b border-gray-100 pb-3 mb-3">
                  <div className="flex items-center mb-2">
                    <img 
                      src="https://images.unsplash.com/photo-1580844946486-f8b5be6c3833?w=150&h=150&fit=crop&q=80" 
                      alt="Tintas & Tintas" 
                      className="w-5 h-5 rounded-full object-cover mr-2"
                    />
                    <span className="font-medium text-sm">Tintas & Tintas</span>
                  </div>
                  <div className="pl-7 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal (1 item)</span>
                      <span>R$ 349,90</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frete</span>
                      <span>Grátis</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>R$ 649,80</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete</span>
                  <span>R$ 15,90</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ 665,70</span>
                </div>
                <div className="flex justify-between text-construPro-orange text-sm">
                  <span>Pontos a ganhar</span>
                  <span>1.300 pontos</span>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-md flex items-start gap-2 mb-4">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">Seu pedido está qualificado para pontos!</p>
                  <p className="text-sm text-green-600">
                    Você ganhará 1.300 pontos quando o pedido for entregue.
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
            {savedAddresses.map((addr) => (
              <div 
                key={addr.id}
                className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${addr.default ? 'border-construPro-blue bg-blue-50' : 'border-gray-200'}`}
                onClick={() => selectAddress(addr)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{addr.street}</p>
                    <p className="text-sm text-gray-600">{addr.complement}</p>
                    <p className="text-sm text-gray-600">
                      {addr.city}, {addr.state} - {addr.zipCode}
                    </p>
                  </div>
                  {addr.default && (
                    <span className="text-xs bg-construPro-blue text-white px-2 py-1 rounded-full">
                      Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-2 flex items-center justify-center" onClick={() => setShowAddressModal(false)}>
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
