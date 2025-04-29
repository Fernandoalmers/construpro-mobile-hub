
import React, { useState, useEffect } from 'react';
import MarketplaceScreen from './MarketplaceScreen';
import ErrorBoundary from '../common/ErrorBoundary';
import LoadingState from '../common/LoadingState';
import ListEmptyState from '../common/ListEmptyState';
import { Package } from 'lucide-react';
import produtos from '../../data/produtos.json';

const MarketplaceScreenWrapper: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<typeof produtos | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call with timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(produtos);
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
    return <LoadingState type="skeleton" text="Carregando produtos..." count={5} />;
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

  // Show the actual screen with data
  return <MarketplaceScreen />;
};

export default MarketplaceScreenWrapper;
