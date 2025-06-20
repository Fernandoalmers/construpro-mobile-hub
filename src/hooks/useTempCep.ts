
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useTempCep() {
  const { isAuthenticated } = useAuth();
  const [tempCep, setTempCep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wasSetInCurrentSession, setWasSetInCurrentSession] = useState(false);

  const setTemporaryCep = useCallback((cep: string) => {
    // NOVA REGRA: Só permitir CEP temporário para usuários não autenticados
    if (isAuthenticated) {
      console.log('[useTempCep] Ignoring temporary CEP for authenticated user');
      return;
    }

    console.log('[useTempCep] Setting temporary CEP:', cep);
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setTempCep(cleanCep);
      setWasSetInCurrentSession(true);
      // Store in sessionStorage for persistence during navigation
      sessionStorage.setItem('temp_delivery_cep', cleanCep);
      sessionStorage.setItem('temp_cep_session_flag', 'true');
    }
  }, [isAuthenticated]);

  const clearTemporaryCep = useCallback(() => {
    console.log('[useTempCep] Clearing temporary CEP');
    setTempCep(null);
    setWasSetInCurrentSession(false);
    sessionStorage.removeItem('temp_delivery_cep');
    sessionStorage.removeItem('temp_cep_session_flag');
  }, []);

  // NOVA FUNCIONALIDADE: Limpar automaticamente quando usuário fazer login
  React.useEffect(() => {
    if (isAuthenticated && tempCep) {
      console.log('[useTempCep] User authenticated, clearing temporary CEP');
      clearTemporaryCep();
    }
  }, [isAuthenticated, tempCep, clearTemporaryCep]);

  // Initialize from sessionStorage on mount (only for non-authenticated users)
  React.useEffect(() => {
    if (!isAuthenticated) {
      const stored = sessionStorage.getItem('temp_delivery_cep');
      const sessionFlag = sessionStorage.getItem('temp_cep_session_flag') === 'true';
      
      if (stored && stored.length === 8) {
        setTempCep(stored);
        setWasSetInCurrentSession(sessionFlag);
        console.log('[useTempCep] Restored from storage:', { stored, sessionFlag });
      }
    } else {
      // Limpar storage se usuário estiver autenticado
      sessionStorage.removeItem('temp_delivery_cep');
      sessionStorage.removeItem('temp_cep_session_flag');
    }
  }, [isAuthenticated]);

  return {
    tempCep: isAuthenticated ? null : tempCep, // Sempre retornar null para usuários autenticados
    isLoading,
    setIsLoading,
    setTemporaryCep,
    clearTemporaryCep,
    wasSetInCurrentSession: isAuthenticated ? false : wasSetInCurrentSession
  };
}
