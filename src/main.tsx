
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext.tsx'
import { CartProvider } from './hooks/use-cart.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import React from 'react'
import { prefetchAdminData } from './utils/prefetchUtils'

// Enhanced QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      // Add network mode for better offline handling
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    }
  }
})

// Prefetch critical data on app start
prefetchAdminData(queryClient).catch(console.warn);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);
