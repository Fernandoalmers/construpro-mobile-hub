
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  // Backwards compatibility props
  onRetry?: () => void | Promise<void> | string;
  retryText?: string;
  errorDetails?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  title, 
  message, 
  actionButton,
  onRetry,
  retryText = "Tentar Novamente",
  errorDetails,
  action
}) => {
  // Determine which action button to show (priority: actionButton > action > onRetry)
  const finalActionButton = actionButton || action || (onRetry ? {
    label: retryText,
    onClick: onRetry
  } : undefined);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      
      {errorDetails && (
        <details className="mb-4 text-sm text-gray-500 max-w-md">
          <summary className="cursor-pointer font-medium">Ver detalhes técnicos</summary>
          <p className="mt-2 text-left bg-gray-50 p-2 rounded text-xs font-mono">
            {errorDetails}
          </p>
        </details>
      )}
      
      {finalActionButton && (
        <button
          onClick={finalActionButton.onClick}
          className="bg-construPro-blue text-white px-6 py-2 rounded-lg hover:bg-construPro-blue/90 transition-colors"
        >
          {finalActionButton.label}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
