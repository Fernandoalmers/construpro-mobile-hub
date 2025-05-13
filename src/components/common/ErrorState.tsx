
import React from 'react';
import { AlertCircle } from 'lucide-react';
import CustomButton from './CustomButton';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  retryText?: string;
  errorDetails?: string; // Added to optionally display technical details
};

const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  className = '',
  retryText = 'Tentar novamente',
  errorDetails
}) => {
  return (
    <div className={`flex flex-col items-center justify-center h-64 p-6 ${className}`}>
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 text-center mb-3">{message}</p>
      {errorDetails && (
        <p className="text-xs text-red-400 text-center mb-4 max-w-md overflow-auto">
          {errorDetails}
        </p>
      )}
      {onRetry && (
        <CustomButton 
          variant="primary"
          onClick={onRetry}
        >
          {retryText}
        </CustomButton>
      )}
    </div>
  );
};

export default ErrorState;
