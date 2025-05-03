
import React, { useState, useEffect } from 'react';
import HomeScreen from './HomeScreen';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import ListEmptyState from '../common/ListEmptyState';
import { Home } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { toast } from "@/components/ui/sonner";

const HomeScreenWrapper: React.FC = () => {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      // Don't fetch if auth is still loading
      if (authLoading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Auth state in HomeScreenWrapper:", { user, profile });
        
        // If we have a profile from auth context, we're good to go
        if (profile) {
          console.log("Using profile from auth context:", profile);
          setLoading(false);
          return;
        }
        
        // If we have a user but no profile, try to fetch profile
        if (user && !profile) {
          console.log("User found but no profile, fetching profile...");
          await refreshProfile();
        }
        
        // After refreshing, we're done loading regardless of success
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
        toast.error("Erro ao carregar dados do usuário");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, profile, authLoading, refreshProfile]);

  const handleRetry = async () => {
    // Reset and fetch again
    setLoading(true);
    setError(null);
    
    try {
      await refreshProfile();
      toast.success("Dados atualizados com sucesso");
    } catch (error) {
      console.error("Error refreshing profile:", error);
      setError(error instanceof Error ? error : new Error('Failed to refresh profile'));
      toast.error("Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state if auth or data is loading
  if (authLoading || loading) {
    return <LoadingState text="Carregando dados do usuário..." />;
  }
  
  // Show error state if there was an error
  if (error) {
    return (
      <ErrorState 
        title="Erro ao carregar dados" 
        message={error.message} 
        onRetry={handleRetry} 
      />
    );
  }

  // If we're not loading and have no user data, show empty state
  if (!user) {
    return (
      <ListEmptyState
        title="Dados não encontrados"
        description="Não foi possível carregar seus dados. Por favor, tente novamente."
        icon={<Home size={48} />}
        action={{
          label: "Tentar novamente",
          onClick: handleRetry,
        }}
      />
    );
  }
  
  // If we have user data, render the home screen
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
};

export default HomeScreenWrapper;
