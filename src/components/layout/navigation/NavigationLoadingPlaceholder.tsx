
import React from 'react';

const NavigationLoadingPlaceholder: React.FC = () => {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-md z-40">
      <div className="flex justify-around items-center h-16">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center justify-center w-full h-full px-2">
            <div className="h-6 w-6 bg-gray-200 rounded-full mb-1"></div>
            <div className="h-3 w-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </nav>
  );
};

export default NavigationLoadingPlaceholder;
