
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import Card from '../common/Card';
import { ArrowLeft, CreditCard, Landmark, QrCode, MapPin, CheckCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

type PaymentMethod = 'credit' | 'boleto' | 'pix';

const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data - in real app this would come from user profile or previous input
  const address = {
    street: 'Av. Paulista, 1000',
    complement: 'Apto 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100'
  };

  const handlePlaceOrder = () => {
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
                <CustomButton variant="link" className="text-sm p-0">
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
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="flex items-center flex-1">
                    <CreditCard size={18} className="mr-2 text-construPro-blue" />
                    Cartão de Crédito
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="boleto" id="boleto" />
                  <Label htmlFor="boleto" className="flex items-center flex-1">
                    <Landmark size={18} className="mr-2 text-construPro-blue" />
                    Boleto Bancário
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
              
              {paymentMethod === 'credit' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-3">Parcele em até 12x sem juros</p>
                  {/* Credit card form would go here in a real app */}
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    Formulário de cartão simplificado para demo
                  </div>
                </div>
              )}
              
              {paymentMethod === 'boleto' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    O boleto será gerado após a confirmação do pedido.
                  </p>
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
              <div className="space-y-2 mb-4">
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
    </div>
  );
};

export default CheckoutScreen;
