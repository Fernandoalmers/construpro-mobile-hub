
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
    console.log(`[${timestamp}] [HomeScreenWrapper] Iniciando carregamento de dados do usuário...`);
    
    // Don't fetch if auth is still loading
    if (authLoading) {
      console.log(`[${timestamp}] [HomeScreenWrapper] Auth ainda carregando, aguardando...`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // If we don't have a user, we shouldn't be on this page
      if (!user) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usuário não encontrado, redirecionando para login`);
        navigate('/login');
        return;
      }
      
      // Use cached profile if available and valid
      if (useCache && cachedProfile && isCacheValid()) {
        const cacheAge = Date.now() - (cachedProfile.updated_at ? new Date(cachedProfile.updated_at).getTime() : 0);
        console.log(`[${timestamp}] [HomeScreenWrapper] Usando perfil do cache (idade: ${Math.round(cacheAge / 1000)}s)`);
        setLoading(false);
        return;
      }
      
      // If we have a profile from auth context, use it and cache it
      if (profile) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usando perfil do contexto de auth:`, profile.id);
        saveToCache(profile);
        setLoading(false);
        setRetryCount(0); // Reset retry count on success
        return;
      }
      
      // If we have a user but no profile, try to fetch profile with timeout
      if (user && !profile) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usuário encontrado mas sem perfil, buscando perfil...`);
        
        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout ao carregar perfil')), 15000); // 15 seconds
        });
        
        // Race between profile fetch and timeout
        const fetchedProfile = await Promise.race([
          refreshProfile(),
          timeoutPromise
        ]);
        
        if (fetchedProfile) {
          console.log(`[${timestamp}] [HomeScreenWrapper] Perfil carregado com sucesso:`, fetchedProfile.id);
          saveToCache(fetchedProfile);
          setRetryCount(0); // Reset retry count on success
        } else if (!authLoading) {
          console.log(`[${timestamp}] [HomeScreenWrapper] Nenhum perfil encontrado após refresh`);
          // Don't redirect to onboarding immediately, user might just have connectivity issues
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error(`[${timestamp}] [HomeScreenWrapper] Erro ao carregar dados do usuário:`, err);
      
      // If we have cached data, use it as fallback
      if (cachedProfile) {
        console.log(`[${timestamp}] [HomeScreenWrapper] Usando perfil do cache como fallback`);
        setLoading(false);
        toast.error("Usando dados salvos. Verifique sua conexão.");
        return;
      }
      
      setError(err instanceof Error ? err : new Error('Falha ao carregar dados do usuário'));
      setLoading(false);
    }
  }, [user, profile, authLoading, refreshProfile, navigate, cachedProfile, isCacheValid, saveToCache]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleRetry = useCallback(async () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    console.log(`[HomeScreenWrapper] Tentativa de retry #${newRetryCount}`);
    
    // Exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000); // Max 10 seconds
    
    if (newRetryCount > 1) {
      console.log(`[HomeScreenWrapper] Aguardando ${delay}ms antes do retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Force fresh data on retry (don't use cache)
    await fetchUserData(false);
    
    if (!error) {
      toast.success("Dados atualizados com sucesso");
    }
  }, [retryCount, fetchUserData, error]);

  // Show loading state if auth or data is loading
  if (authLoading || loading) {
    console.log("[HomeScreenWrapper] Mostrando estado de carregamento");
    return <LoadingState text="Carregando seus dados..." />;
  }
  
  // Show error state if there was an error and no cached fallback
  if (error && !cachedProfile) {
    console.log("[HomeScreenWrapper] Mostrando estado de erro:", error.message);
    return (
      <ErrorState 
        title="Erro ao carregar dados" 
        message={`${error.message}${retryCount > 0 ? ` (Tentativa ${retryCount})` : ''}`}
        onRetry={handleRetry} 
      />
    );
  }

  // If we're not loading and have no user data (and no cache), show empty state
  if (!user && !cachedProfile) {
    console.log("[HomeScreenWrapper] Nenhum dado de usuário encontrado, mostrando estado vazio");
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
  
  // If we have user data or cached fallback, render the home screen
  console.log("[HomeScreenWrapper] Renderizando componente HomeScreen");
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
};

export default HomeScreenWrapper;
