
import React from 'react';
import { CheckCircle } from 'lucide-react';

const OrderSuccessMessage: React.FC = () => {
  return (
    <div className="mb-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-green-600 mb-2">Pedido Confirmado!</h2>
      <p className="text-gray-600">
        Seu pedido foi realizado com sucesso e está sendo processado.
      </p>
    </div>
  );
};

export default OrderSuccessMessage;
