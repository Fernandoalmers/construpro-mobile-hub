import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const FavoritesLoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
          <Skeleton className="h-40 w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center mt-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FavoritesLoadingSkeleton;