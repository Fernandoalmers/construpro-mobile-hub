
import React from 'react';
import ErrorState from '@/components/common/ErrorState';
import { AlertCircle } from 'lucide-react';

interface CheckoutErrorStateProps {
  error: string;
  attemptCount: number;
  onRetry: () => void;
}

const CheckoutErrorState: React.FC<CheckoutErrorStateProps> = ({
  error,
  attemptCount,
  onRetry
}) => {
  return (
    <div className="p-4 border rounded-md bg-red-50 border-red-200 mb-4">
      <div className="mb-3 flex items-center gap-2 text-red-700">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-semibold">Erro ao processar pedido</h3>
      </div>
      
      <div className="text-sm text-red-600 mb-3">
        <p className="mb-1">Detalhes do erro:</p>
        <p className="font-mono bg-red-100 p-2 rounded text-xs overflow-auto max-h-28">
          {error}
        </p>
        {attemptCount > 1 && (
          <p className="mt-2 text-xs">Tentativas anteriores: {attemptCount}</p>
        )}
      </div>
      
      <div className="mt-2 flex flex-col gap-2">
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm transition-colors"
        >
          Tentar novamente
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="border border-red-300 hover:bg-red-100 text-red-700 py-2 px-4 rounded text-sm transition-colors"
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
};

export default CheckoutErrorState;
