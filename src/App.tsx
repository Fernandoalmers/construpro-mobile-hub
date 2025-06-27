import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { store } from './store';
import Router from './routes';
import RobustErrorBoundary from '@/components/common/RobustErrorBoundary';
import { CartProvider } from '@/hooks/cart/use-cart-optimized';

// Import the fixed CEP cache system
import '@/lib/cepCacheFixed';

function App() {
  return (
    <RobustErrorBoundary showDetails={import.meta.env.DEV}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <Provider store={store}>
              <AuthProvider>
                <CartProvider>
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <Router />
                  </div>
                </CartProvider>
              </AuthProvider>
            </Provider>
          </TooltipProvider>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </RobustErrorBoundary>
  );
}

export default App;
