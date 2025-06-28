
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  text?: string;
  type?: 'spinner' | 'skeleton' | 'dots';
  count?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  text = "Carregando...", 
  type = 'spinner',
  count = 3
}) => {
  if (type === 'skeleton') {
    return (
      <div className="space-y-4">
        {text && (
          <p className="text-sm text-gray-500 mb-4">{text}</p>
        )}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="flex space-x-1 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-construPro-blue rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    );
  }

  // Default spinner type
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
};

export default LoadingState;
