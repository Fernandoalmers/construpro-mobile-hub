
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const OrderConfirmationScreen: React.FC = () => {
  const navigate = useNavigate();
  const orderId = 'ORD-' + Math.floor(Math.random() * 10000);
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 text-center">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        
        <h1 className="text-2xl font-bold mb-2">Pedido Confirmado!</h1>
        <p className="text-gray-600 mb-6">
          Seu pedido foi recebido e está sendo processado.
        </p>
        
        <div className="bg-gray-50 p-4 rounded mb-6">
          <div className="mb-2">
            <span className="font-semibold">Número do Pedido:</span>
            <span className="ml-2">{orderId}</span>
          </div>
          <div>
            <span className="font-semibold">Data:</span>
            <span className="ml-2">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            variant="default" 
            className="w-full" 
            onClick={() => navigate('/profile/orders')}
          >
            Ver meus pedidos
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/')}
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationScreen;
