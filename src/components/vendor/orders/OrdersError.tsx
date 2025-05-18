
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdersErrorProps {
  onRetry: () => void;
}

const OrdersError: React.FC<OrdersErrorProps> = ({ onRetry }) => {
  return (
    <div className="p-6 flex flex-col items-center justify-center">
      <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4 flex items-start">
        <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-1" size={20} />
        <div>
          <p className="text-red-700 font-medium">Erro ao carregar pedidos</p>
          <p className="text-red-600 text-sm mt-1">Verifique suas permissões e tente novamente</p>
        </div>
      </div>
      <Button 
        className="px-4 py-2 bg-construPro-blue text-white rounded"
        onClick={onRetry}
      >
        Tentar novamente
      </Button>
    </div>
  );
};

export default OrdersError;
