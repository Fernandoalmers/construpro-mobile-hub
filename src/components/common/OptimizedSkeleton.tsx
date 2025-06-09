
import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedSkeletonProps {
  rows?: number;
  className?: string;
}

const OptimizedSkeleton = memo<OptimizedSkeletonProps>(({ rows = 5, className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
});

OptimizedSkeleton.displayName = 'OptimizedSkeleton';

export default OptimizedSkeleton;
