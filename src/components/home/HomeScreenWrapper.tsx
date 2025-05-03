import React, { useState, useEffect } from 'react';
import HomeScreen from './HomeScreen';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import ListEmptyState from '../common/ListEmptyState';
import { Home } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { toast } from "@/components/ui/sonner";
import clientes from '../../data/clientes.json';

const HomeScreenWrapper: React.FC = () => {
  const { user, profile, isLoading: authLoading, getProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      // Don't fetch if auth is still loading
      if (authLoading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Auth state in HomeScreenWrapper:", { user, profile });
        
        // If we have a profile from auth context, use it
        if (profile) {
          console.log("Using profile from auth context:", profile);
          setUserData({
            ...profile,
            // Ensure we have saldoPontos for display
            saldoPontos: profile.saldo_pontos || 0,
          });
          setLoading(false);
          return;
        }
        
        // If we have a user but no profile, try to fetch profile
        if (user && !profile) {
          console.log("User found but no profile, fetching profile...");
          const profileData = await getProfile();
          if (profileData) {
            console.log("Profile fetched successfully:", profileData);
            setUserData({
              ...profileData,
              saldoPontos: profileData.saldo_pontos || 0,
            });
            setLoading(false);
            return;
          }
        }
        
        // Fallback to mock data if no profile
        if (user) {
          console.log("No profile available, looking for data in clientes:", user.id);
          const clienteData = clientes.find(cliente => cliente.id === user.id);
          
          if (clienteData) {
            console.log("User data found in clientes:", clienteData);
            setUserData(clienteData);
          } else {
            console.log("User data not found in clientes, using auth user");
            setUserData({
              ...user,
              saldoPontos: 0,
              papel: 'consumidor'
            });
          }
        } else {
          // Se não houver usuário autenticado, use o primeiro cliente do arquivo de dados
          console.log("No user in auth context, using demo user");
          const demoUser = clientes[0];
          setUserData({
            ...demoUser,
            saldoPontos: 1250,
            papel: 'profissional'
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
        toast.error("Erro ao carregar dados do usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, profile, authLoading, getProfile]);

  const handleRetry = () => {
    // Reset and fetch again
    setUserData(null);
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      if (profile) {
        setUserData({
          ...profile,
          saldoPontos: profile.saldo_pontos || 0,
        });
        toast.success("Dados atualizados com sucesso");
      } else if (user) {
        const clienteData = clientes.find(cliente => cliente.id === user.id);
        setUserData(clienteData || {
          ...user,
          saldoPontos: 0,
          papel: 'consumidor'
        });
        toast.success("Dados atualizados com sucesso");
      } else {
        // Usar o primeiro cliente como demonstração
        const demoUser = clientes[0];
        setUserData({
          ...demoUser,
          saldoPontos: 1250,
          papel: 'profissional'
        });
        toast.success("Dados de demonstração carregados com sucesso");
      }
      setLoading(false);
    }, 600);
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

  // Show empty state if no user data
  if (!userData) {
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
