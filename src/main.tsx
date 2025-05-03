
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider } from './hooks/use-cart'

// Create a client
const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <App />
    </CartProvider>
  </QueryClientProvider>
);
