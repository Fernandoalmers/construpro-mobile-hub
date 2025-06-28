
import React, { useState, useEffect, useCallback } from 'react';
import HomeScreen from './HomeScreen';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import ListEmptyState from '../common/ListEmptyState';
import { Home } from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { toast } from "@/components/ui/sonner";
import { useNavigate } from 'react-router-dom';
import { useProfileCache } from '@/hooks/useProfileCache';

const HomeScreenWrapper: React.FC = () => {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const { cachedProfile, saveToCache, isCacheValid } = useProfileCache();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async (useCache: boolean = true) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [HomeScreenWrapper] Iniciando carregamento de dados...`);
    
    if (authLoading) {
      console.log(`[${timestamp}] [HomeScreenWrapper] Auth ainda carregando, aguardando...`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usuário não encontrado, redirecionando`);
        navigate('/login');
        return;
      }
      
      // Usar cache se disponível e válido
      if (useCache && cachedProfile && isCacheValid()) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usando perfil do cache`);
        setLoading(false);
        return;
      }
      
      // Usar perfil do contexto se disponível
      if (profile) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usando perfil do contexto:`, profile.id);
        saveToCache(profile);
        setLoading(false);
        setRetryCount(0);
        return;
      }
      
      // Tentar buscar perfil com timeout reduzido
      if (user && !profile) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Buscando perfil...`);
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout ao carregar perfil')), 5000); // Reduzido para 5s
        });
        
        const fetchedProfile = await Promise.race([
          refreshProfile(),
          timeoutPromise
        ]);
        
        if (fetchedProfile) {
          console.log(`[${timestamp}] [HomeScreenWrapper] Perfil carregado:`, fetchedProfile.id);
          saveToCache(fetchedProfile);
          setRetryCount(0);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error(`[${timestamp}] [HomeScreenWrapper] Erro:`, err);
      
      // Usar cache como fallback
      if (cachedProfile) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usando cache como fallback`);
        setLoading(false);
        toast.error("Usando dados salvos. Verifique sua conexão.");
        return;
      }
      
      setError(err instanceof Error ? err : new Error('Falha ao carregar dados'));
      setLoading(false);
    }
  }, [user, profile, authLoading, refreshProfile, navigate, cachedProfile, isCacheValid, saveToCache]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleRetry = useCallback(async () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    console.log(`[HomeScreenWrapper] Retry #${newRetryCount}`);
    
    // Delay progressivo mais suave
    const delay = Math.min(500 * newRetryCount, 2000);
    
    if (newRetryCount > 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await fetchUserData(false);
    
    if (!error) {
      toast.success("Dados atualizados");
    }
  }, [retryCount, fetchUserData, error]);

  if (authLoading || loading) {
    return <LoadingState text="Carregando seus dados..." />;
  }
  
  if (error && !cachedProfile) {
    return (
      <ErrorState 
        title="Erro ao carregar dados" 
        message={`${error.message}${retryCount > 0 ? ` (Tentativa ${retryCount})` : ''}`}
        onRetry={handleRetry} 
      />
    );
  }

  if (!user && !cachedProfile) {
    return (
      <ListEmptyState
        title="Dados não encontrados"
        description="Não foi possível carregar seus dados. Tente novamente."
        icon={<Home size={48} />}
        action={{
          label: "Tentar novamente",
          onClick: handleRetry,
        }}
      />
    );
  }
  
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
};

export default HomeScreenWrapper;
