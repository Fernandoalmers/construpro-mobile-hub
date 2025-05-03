
import React from 'react';
import { AlertCircle } from 'lucide-react';
import CustomButton from './CustomButton';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
};

const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center h-64 p-6 ${className}`}>
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 text-center mb-6">{message}</p>
      {onRetry && (
        <CustomButton 
          variant="primary"
          onClick={onRetry}
        >
          Tentar novamente
        </CustomButton>
      )}
    </div>
  );
};

export default ErrorState;
