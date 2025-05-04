
import React from 'react';

const ProductLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="p-3 flex animate-pulse bg-white rounded-md shadow-sm">
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
};

export default ProductLoadingSkeleton;
