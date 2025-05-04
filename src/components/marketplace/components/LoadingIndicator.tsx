
import React from 'react';

interface LoadingIndicatorProps {
  loadMoreRef: React.RefObject<HTMLDivElement>;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ loadMoreRef }) => {
  return (
    <div 
      ref={loadMoreRef} 
      className="flex justify-center items-center p-4 mt-4"
    >
      <div className="w-8 h-8 border-4 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingIndicator;
