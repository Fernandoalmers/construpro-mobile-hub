
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

const ErrorState: React.FC<ErrorStateProps> = ({ title, message, actionButton }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="bg-construPro-blue text-white px-6 py-2 rounded-lg hover:bg-construPro-blue/90 transition-colors"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
