
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MarketplaceScreen from './MarketplaceScreen';
import MarketplaceHomeScreen from './MarketplaceHomeScreen';
import ErrorBoundary from '../common/ErrorBoundary';
import LoadingState from '../common/LoadingState';
import ListEmptyState from '../common/ListEmptyState';
import ErrorState from '../common/ErrorState';
import { Package } from 'lucide-react';
import produtos from '../../data/produtos.json';

const MarketplaceScreenWrapper: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<typeof produtos | null>(null);
  const location = useLocation();
  
  // Check if we should show products or home screen
  const showProducts = location.pathname === '/marketplace/products';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add ratings to products if they don't have them (for demo purposes)
        const enhancedProducts = produtos.map(product => ({
          ...product,
          avaliacao: product.avaliacao || Math.random() * 2 + 3 // Random rating between 3-5
        }));
        
        setData(enhancedProducts);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRetry = () => {
    // Reset states and fetch data again
    setData(null);
    setError(null);
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setData(produtos);
      setLoading(false);
    }, 1000);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="p-4 pt-8 bg-construPro-blue">
          <h1 className="text-2xl font-bold text-white mb-4">
            {showProducts ? 'Produtos' : 'Loja'}
          </h1>
          <div className="h-10 w-full bg-white/20 rounded-md animate-pulse mb-4"></div>
        </div>
        <LoadingState type="skeleton" text="Carregando..." count={6} />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorState 
        title="Erro ao carregar produtos" 
        message={error.message} 
        onRetry={handleRetry} 
      />
    );
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <ListEmptyState 
        title="Nenhum produto encontrado" 
        description="Não há produtos disponíveis no momento."
        icon={<Package size={48} />}
        action={{
          label: "Tentar novamente",
          onClick: handleRetry,
        }}
      />
    );
  }

  // Conditionally render home or product screen
  return showProducts ? <MarketplaceScreen /> : <MarketplaceHomeScreen />;
};

export default MarketplaceScreenWrapper;
