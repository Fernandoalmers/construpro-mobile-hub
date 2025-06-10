
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MarketplaceScreen from './MarketplaceScreen';
import MarketplaceHomeScreen from './MarketplaceHomeScreen';
import ErrorBoundary from '../common/ErrorBoundary';

const MarketplaceScreenWrapper: React.FC = () => {
  const location = useLocation();
  
  // Check if we should show products or home screen
  const showProducts = location.pathname === '/marketplace/products';

  // Conditionally render marketplace or home screen
  return (
    <ErrorBoundary>
      {showProducts ? <MarketplaceScreen /> : <MarketplaceHomeScreen />}
    </ErrorBoundary>
  );
};

export default MarketplaceScreenWrapper;
