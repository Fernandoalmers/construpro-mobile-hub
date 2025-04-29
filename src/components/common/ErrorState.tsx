
import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import CustomButton from './CustomButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Algo deu errado',
  message = 'Não foi possível carregar os dados. Por favor, tente novamente.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <CustomButton variant="primary" onClick={onRetry}>
          Tentar Novamente
        </CustomButton>
      )}
    </div>
  );
};

export default ErrorState;
