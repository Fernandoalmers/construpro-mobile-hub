
import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton';
  text?: string;
  count?: number;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  text = 'Carregando...',
  count = 3,
  className,
}) => {
  if (type === 'spinner') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-10", className)}>
        <div className="h-8 w-8 rounded-full border-4 border-construPro-blue border-t-transparent animate-spin mb-3" />
        {text && <p className="text-gray-500 text-sm">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 py-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingState;
