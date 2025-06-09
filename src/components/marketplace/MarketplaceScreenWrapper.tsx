
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import OptimizedMarketplaceScreen from './OptimizedMarketplaceScreen';
import MarketplaceHomeScreen from './MarketplaceHomeScreen';
import ErrorBoundary from '../common/ErrorBoundary';
import LoadingState from '../common/LoadingState';
import ListEmptyState from '../common/ListEmptyState';
import ErrorState from '../common/ErrorState';
import { Package } from 'lucide-react';

const MarketplaceScreenWrapper: React.FC = () => {
  const location = useLocation();
  
  // Check if we should show products or home screen
  const showProducts = location.pathname === '/marketplace/products';

  // Conditionally render optimized marketplace or home screen
  return (
    <ErrorBoundary>
      {showProducts ? <OptimizedMarketplaceScreen /> : <MarketplaceHomeScreen />}
    </ErrorBoundary>
  );
};

export default MarketplaceScreenWrapper;
