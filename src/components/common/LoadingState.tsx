
import React from 'react';

type LoadingStateProps = {
  type?: 'spinner' | 'skeleton';
  text?: string;
  count?: number;
  className?: string;
};

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  text = 'Carregando...',
  count = 1,
  className = ''
}) => {
  if (type === 'skeleton') {
    return (
      <div className={`p-6 space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white rounded-md shadow-sm p-3 flex animate-pulse">
            <div className="w-24 h-24 bg-gray-200 rounded-md mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
      <div className="w-12 h-12 border-4 border-construPro-blue border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500">{text}</p>
    </div>
  );
};

export default LoadingState;
