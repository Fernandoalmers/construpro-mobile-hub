
import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`flex flex-col items-center justify-center h-64 p-6 ${className}`}>
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 text-center mb-3">{message}</p>
      
      {errorDetails && (
        <div className="w-full max-w-md mb-4">
          <button 
            className="flex items-center justify-center text-xs text-gray-500 mb-2 mx-auto"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <>
                <ChevronUp size={14} className="mr-1" />
                Ocultar detalhes técnicos
              </>
            ) : (
              <>
                <ChevronDown size={14} className="mr-1" />
                Mostrar detalhes técnicos
              </>
            )}
          </button>
          
          {showDetails && (
            <div className="bg-gray-100 rounded p-3 overflow-auto max-h-28 text-xs text-red-500 font-mono">
              {errorDetails}
            </div>
          )}
        </div>
      )}
      
      {onRetry && (
        <CustomButton 
          variant="primary"
          onClick={onRetry}
          className="mt-2"
        >
          {retryText}
        </CustomButton>
      )}
    </div>
  );
};

export default ErrorState;
