
import React, { useState, useEffect } from 'react';
import HomeScreen from './HomeScreen';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import ListEmptyState from '../common/ListEmptyState';
import { Home } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { toast } from "@/components/ui/sonner";
import { useNavigate } from 'react-router-dom';

const HomeScreenWrapper: React.FC = () => {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      // Don't fetch if auth is still loading
      if (authLoading) {
        console.log("HomeScreenWrapper: Auth still loading, waiting...");
        return;
      }
      
      console.log("HomeScreenWrapper: Fetching user data...");
      setLoading(true);
      setError(null);
      
      try {
        console.log("Auth state in HomeScreenWrapper:", { 
          userId: user?.id,
          profileId: profile?.id,
          authenticated: !!user
        });
        
        // If we don't have a user, we shouldn't be on this page
        if (!user) {
          console.log("HomeScreenWrapper: No user found, will redirect to login");
          navigate('/login');
          return;
        }
        
        // If we have a profile from auth context, we're good to go
        if (profile) {
          console.log("HomeScreenWrapper: Using profile from auth context:", profile.id);
          setLoading(false);
          return;
        }
        
        // If we have a user but no profile, try to fetch profile
        if (user && !profile) {
          console.log("HomeScreenWrapper: User found but no profile, fetching profile...");
          const fetchedProfile = await refreshProfile();
          
          if (!fetchedProfile && !authLoading) {
            console.log("HomeScreenWrapper: No profile found after refresh, user may need onboarding");
            // If we still don't have a profile, the user might need onboarding
            // navigate('/onboarding');
            // return;
          }
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
  }, [user, profile, authLoading, refreshProfile, navigate]);

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
    console.log("HomeScreenWrapper: Showing loading state");
    return <LoadingState text="Carregando dados do usuário..." />;
  }
  
  // Show error state if there was an error
  if (error) {
    console.log("HomeScreenWrapper: Showing error state:", error.message);
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
    console.log("HomeScreenWrapper: No user found, showing empty state");
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
  console.log("HomeScreenWrapper: Rendering HomeScreen component");
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
};

export default HomeScreenWrapper;
