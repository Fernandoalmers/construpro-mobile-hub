
import React, { useState, useCallback } from 'react';

export function useTempCep() {
  const [tempCep, setTempCep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wasSetInCurrentSession, setWasSetInCurrentSession] = useState(false);

  const setTemporaryCep = useCallback((cep: string) => {
    console.log('[useTempCep] Setting temporary CEP:', cep);
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setTempCep(cleanCep);
      setWasSetInCurrentSession(true);
      // Store in sessionStorage for persistence during navigation
      sessionStorage.setItem('temp_delivery_cep', cleanCep);
      sessionStorage.setItem('temp_cep_session_flag', 'true');
    }
  }, []);

  const clearTemporaryCep = useCallback(() => {
    console.log('[useTempCep] Clearing temporary CEP');
    setTempCep(null);
    setWasSetInCurrentSession(false);
    sessionStorage.removeItem('temp_delivery_cep');
    sessionStorage.removeItem('temp_cep_session_flag');
  }, []);

  // Clear temp CEP when user has registered address and didn't set temp CEP in current session
  const clearIfUserHasAddress = useCallback((hasUserAddress: boolean) => {
    if (hasUserAddress && tempCep && !wasSetInCurrentSession) {
      console.log('[useTempCep] User has registered address, clearing old temp CEP');
      clearTemporaryCep();
    }
  }, [tempCep, wasSetInCurrentSession, clearTemporaryCep]);

  // Initialize from sessionStorage on mount
  React.useEffect(() => {
    const stored = sessionStorage.getItem('temp_delivery_cep');
    const sessionFlag = sessionStorage.getItem('temp_cep_session_flag') === 'true';
    
    if (stored && stored.length === 8) {
      setTempCep(stored);
      setWasSetInCurrentSession(sessionFlag);
      console.log('[useTempCep] Restored from storage:', { stored, sessionFlag });
    }
  }, []);

  return {
    tempCep,
    isLoading,
    setIsLoading,
    setTemporaryCep,
    clearTemporaryCep,
    clearIfUserHasAddress,
    wasSetInCurrentSession
  };
}
