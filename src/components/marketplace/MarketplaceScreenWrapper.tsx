
import React from 'react';
import { useLocation } from 'react-router-dom';
import OptimizedMarketplaceScreen from './OptimizedMarketplaceScreen';
import MarketplaceHomeScreen from './MarketplaceHomeScreen';
import ErrorBoundary from '../common/ErrorBoundary';

const MarketplaceScreenWrapper: React.FC = () => {
  const location = useLocation();
  
  // Check if we should show products or home screen
  const showProducts = location.pathname === '/marketplace/products';

  // Always use OptimizedMarketplaceScreen for products view
  return (
    <ErrorBoundary>
      {showProducts ? <OptimizedMarketplaceScreen /> : <MarketplaceHomeScreen />}
    </ErrorBoundary>
  );
};

export default MarketplaceScreenWrapper;
