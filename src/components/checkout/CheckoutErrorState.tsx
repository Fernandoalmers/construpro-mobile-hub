
import React from 'react';
import ErrorState from '@/components/common/ErrorState';

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
    <div className="p-4">
      <ErrorState 
        title="Erro ao processar pedido" 
        message={error}
        errorDetails={`Tentativas: ${attemptCount}. Último erro: ${error}`}
        onRetry={onRetry}
        retryText="Tentar novamente"
      />
    </div>
  );
};

export default CheckoutErrorState;
