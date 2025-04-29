
import React, { useState, useEffect } from 'react';
import HomeScreen from './HomeScreen';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import ListEmptyState from '../common/ListEmptyState';
import { Home } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import clientes from '../../data/clientes.json';

const HomeScreenWrapper: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Find user data in the mock data
        if (user) {
          const clienteData = clientes.find(cliente => cliente.id === user.id);
          setUserData(clienteData || user);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleRetry = () => {
    // Reset and fetch again
    setUserData(null);
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      if (user) {
        const clienteData = clientes.find(cliente => cliente.id === user.id);
        setUserData(clienteData || user);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <ErrorBoundary>
      {loading ? (
        <LoadingState text="Carregando dados do usuário..." />
      ) : error ? (
        <ErrorState 
          title="Erro ao carregar dados" 
          message={error.message} 
          onRetry={handleRetry} 
        />
      ) : !userData ? (
        <ListEmptyState
          title="Dados não encontrados"
          description="Não foi possível carregar seus dados. Por favor, tente novamente."
          icon={<Home size={48} />}
          action={{
            label: "Tentar novamente",
            onClick: handleRetry,
          }}
        />
      ) : (
        <HomeScreen />
      )}
    </ErrorBoundary>
  );
};

export default HomeScreenWrapper;
