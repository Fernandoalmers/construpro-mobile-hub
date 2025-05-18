
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OrdersErrorProps {
  onRetry: () => void;
  errorType?: 'permission' | 'network' | 'data' | 'unknown';
}

const OrdersError: React.FC<OrdersErrorProps> = ({ onRetry, errorType = 'unknown' }) => {
  // Different error messages based on error type
  const errorMessages = {
    permission: {
      title: 'Erro de permissão',
      description: 'Você não tem permissão para acessar estes dados. Verifique se seu perfil está configurado como vendedor.',
    },
    network: {
      title: 'Erro de conexão',
      description: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
    },
    data: {
      title: 'Erro nos dados',
      description: 'Ocorreu um problema ao processar os dados dos pedidos.',
    },
    unknown: {
      title: 'Erro ao carregar pedidos',
      description: 'Verifique suas permissões e tente novamente',
    }
  };

  const { title, description } = errorMessages[errorType];

  return (
    <div className="p-6 flex flex-col items-center justify-center">
      <Card className="p-6 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-50 border border-red-200 p-4 rounded-full mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-red-700 mb-2">{title}</h2>
          <p className="text-red-600 text-sm mb-6">{description}</p>
          
          <Button 
            onClick={onRetry}
            className="px-4 py-2 bg-construPro-blue text-white rounded"
          >
            Tentar novamente
          </Button>
          
          <p className="text-xs text-gray-500 mt-4">
            Se o problema persistir, entre em contato com o suporte ou verifique se seu perfil de vendedor está configurado corretamente.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default OrdersError;
