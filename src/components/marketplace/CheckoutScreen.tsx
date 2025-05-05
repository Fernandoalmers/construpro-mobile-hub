
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';

const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Placeholder for checkout logic
    toast.success("Pedido realizado com sucesso!");
    navigate('/order-confirmation');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Endereço de entrega</h2>
            <div className="space-y-4">
              <p>Este é um componente de demonstração. Em uma implementação completa, aqui seriam exibidos campos para endereço.</p>
            </div>
            
            <Separator className="my-6" />
            
            <h2 className="text-lg font-semibold mb-4">Método de pagamento</h2>
            <div className="space-y-4">
              <p>Este é um componente de demonstração. Em uma implementação completa, aqui seriam exibidas opções de pagamento.</p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Resumo do pedido</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ 150,00</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>R$ 15,00</span>
              </div>
              <div className="flex justify-between">
                <span>Imposto</span>
                <span>R$ 10,00</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>R$ 175,00</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              onClick={handleCheckout}
            >
              Finalizar Compra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutScreen;
