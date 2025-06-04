
import React, { memo } from 'react';

interface LoadingIndicatorProps {
  loadMoreRef: React.RefObject<HTMLDivElement>;
  isVisible?: boolean;
  text?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = memo(({ 
  loadMoreRef, 
  isVisible = true,
  text = "Carregando mais produtos..." 
}) => {
  if (!isVisible) return null;

  return (
    <div 
      ref={loadMoreRef} 
      className="flex justify-center items-center p-6 mt-4"
    >
      <div className="w-6 h-6 border-2 border-construPro-blue border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-3 text-sm text-gray-500">{text}</span>
    </div>
  );
});

LoadingIndicator.displayName = 'LoadingIndicator';

export default LoadingIndicator;
